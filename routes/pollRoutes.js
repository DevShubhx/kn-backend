// routes/pollRoutes.js - Complete Fixed Production Block
const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');

// 🎯 FIXED HIGH ACCURACY: protectAdmin को भी authMiddleware से कड़ाई से यहाँ इम्पोर्ट करना
const { protectUser, protectAdmin } = require('../middleware/authMiddleware');

// 🎯 SEED INITIAL POLL DATA (यदि डेटाबेस में पोल नहीं है, तो डिफ़ॉल्ट 3 शोज़ के साथ बनाएं)
const seedPoll = async () => {
    const existingPoll = await Poll.findOne({ pollId: "best_of_three" });
    if (!existingPoll) {
        await Poll.create({
            pollId: "best_of_three",
            options: [
                { showName: "Dexter's Laboratory", votes: 0 },
                { showName: "Johnny Bravo", votes: 0 },
                { showName: "The Powerpuff Girls", votes: 0 }
            ]
        });
    }
};
seedPoll().catch(err => console.error("Poll Seeding Failed:", err));

/**
 * @route   GET /api/poll/results
 * @desc    Public: Get current vote percentages without numbers
 */
router.get('/results', async (req, res) => {
    try {
        const poll = await Poll.findOne({ pollId: "best_of_three" }).lean();
        if (!poll) return res.status(404).json({ message: 'Poll configuration grid lost.' });

        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
        
        // प्रत्येक शो का प्रतिशत निकालें
        const structuredOptions = poll.options.map(opt => ({
            _id: opt._id,
            showName: opt.showName,
            percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
            rawVotes: parseInt(opt.votes, 10)
        }));

        // 🎯 STRICT COMPETITIVE MATRIX:
        const structuredWithWinner = structuredOptions.map(currentOpt => {
            const otherVotes = structuredOptions
                .filter(o => String(o._id) !== String(currentOpt._id))
                .map(o => o.rawVotes);
            
            const highestCompetitorVotes = Math.max(...otherVotes);
            const isStrictWinner = currentOpt.rawVotes > 0 && currentOpt.rawVotes > highestCompetitorVotes;

            let voteStatus = 'lesser-or-equal';
            if (currentOpt.rawVotes === 0) {
                voteStatus = 'zero';
            } else if (isStrictWinner) {
                voteStatus = 'winner';
            }

            return {
                _id: currentOpt._id,
                showName: currentOpt.showName,
                percentage: currentOpt.percentage,
                voteStatus: voteStatus
            };
        });

        return res.status(200).json({ isLive: true, options: structuredWithWinner });
    } catch (err) {
        return res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

/**
 * @route   POST /api/poll/vote
 * @desc    Private: Cast user vote safely
 */
router.post('/vote', protectUser, async (req, res) => {
    try {
        const { optionId } = req.body;
        const userId = req.user._id;

        if (!optionId) return res.status(400).json({ message: 'Mandatory option selection parameter is missing.' });

        const poll = await Poll.findOne({ pollId: "best_of_three" });
        if (!poll) return res.status(404).json({ message: 'Active poll context not found.' });

        if (poll.votedUsers.includes(userId)) {
            return res.status(400).json({ message: 'You have already cast your VOTE.' });
        }

        const targetOption = poll.options.id(optionId);
        if (!targetOption) return res.status(400).json({ message: 'Invalid option targeting.' });

        targetOption.votes += 1;
        poll.votedUsers.push(userId);
        await poll.save();

        return res.status(200).json({ success: true, message: 'Vote successfully injected into MERN cluster.' });
    } catch (err) {
        return res.status(500).json({ message: 'Voting transaction failed: ' + err.message });
    }
});

/**
 * @route   POST /api/poll/reset
 * @desc    Admin Panel: Reset all votes to zero, flush voted users, and update to 3 new show names
 * @access  Private / Admin Only
 */
router.post('/reset', protectAdmin, async (req, res) => {
    try {
        const { showOne, showTwo, showThree } = req.body;

        if (!showOne || !showTwo || !showThree) {
            return res.status(400).json({ message: 'Missing required payload variables for new show names.' });
        }

        const resetPoll = await Poll.findOneAndUpdate(
            { pollId: "best_of_three" },
            {
                $set: {
                    options: [
                        { showName: showOne.trim(), votes: 0 },
                        { showName: showTwo.trim(), votes: 0 },
                        { showName: showThree.trim(), votes: 0 }
                    ],
                    votedUsers: []
                }
            },
            { returnDocument: 'after', upsert: true }
        );

        return res.status(200).json({ 
            success: true, 
            message: 'Poll network cluster successfully reset to absolute zero for the next round!',
            poll: resetPoll 
        });
    } catch (err) {
        return res.status(500).json({ message: 'Master reset transaction failed: ' + err.message });
    }
});

module.exports = router;
