const { protectAdmin } = require('../middleware/authMiddleware');
const express = require('express');
const router = express.Router();
const Show = require('../models/Show'); // Note: Models folder capital 'S' matched safely

// =========================================================================
// LEVEL 1: STATIC & GLOBAL VIEW ROUTES (Must sit at the absolute top!)
// =========================================================================

/**
 * @route   GET /api/shows
 * @desc    Get all catalog items sorted by the latest activity date!
 */
router.get('/', async (req, res) => {
  try {
    // 🎯 मोंगोडीबी लेवल पर सॉर्टिंग: सबसे नया लास्ट एपिसोड अपडेट सबसे ऊपर
    const allShows = await Show.find().sort({ lastEpisodeAddedAt: -1, createdAt: -1 });
    return res.json(allShows);
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching catalog: ' + err.message });
  }
});

/**
 * @route   GET /api/shows/live-timetable
 * @desc    Get all scheduled live shows calibrated with hyper-accurate server millisecond time
 * 🌟 PLACED SAFELY AT LEVEL 1 TO PREVENT :id ROUTE COLLISION
 */
router.get('/live-timetable', async (req, res) => {
  try {
    // 🕒 सर्वर का बिल्कुल सटीक करंट टाइमस्टैम्प (मिलिसेकंड शुद्धता के साथ)
    const serverTimeMs = Date.now();

    // केवल लाइव के लिए शेड्यूल शो लें और उन्हें स्टार्ट टाइम के हिसाब से क्रम (Sort) में लगाएं
    const liveShows = await Show.find({ isLiveScheduled: true })
      .sort({ liveStartTime: 1 })
      .lean();

    return res.status(200).json({
      serverTimeMs, // फ्रंटएंड क्लॉक ड्रिफ्ट को सिंक करने का मुख्य इंजन
      schedule: liveShows
    });
  } catch (err) {
    console.error("📋 Live Timetable Matrix Fetch Error:", err);
    return res.status(500).json({
      message: 'Server error while generating live timetable: ' + err.message
    });
  }
});

/**
 * @route   GET /api/shows/admin/pending-comments
 * @desc    Admin Panel: Fetch all unapproved comments across all shows for moderation
 * @access  Private / Admin
 * 🌟 PLACED BEFORE /:id COLLISION DETECTOR SO IT WORKS FLUTTER FREE
 */
router.get('/admin/pending-comments', protectAdmin, async (req, res) => {
  try {
    const shows = await Show.find({ "comments.isApproved": false }, 'title comments');

    let pendingList = [];
    shows.forEach(show => {
      if (show.comments) {
        show.comments.forEach(comment => {
          if (!comment.isApproved) {
            pendingList.push({
              showId: show._id,
              showTitle: show.title,
              commentId: comment._id,
              username: comment.username,
              text: comment.text,
              createdAt: comment.createdAt
            });
          }
        });
      }
    });

    return res.status(200).json(pendingList);
  } catch (err) {
    return res.status(500).json({ message: "Failed to gather pending comment logs: " + err.message });
  }
});

/**
 * @route   POST /api/shows/add
 * @desc    Add a brand new content profile (SECURED)
 */
router.post('/add', protectAdmin, async (req, res) => {
  const { title, description, contentType, posterUrl, cardUrl, genre } = req.body;
  try {
    const newShow = new Show({
      title,
      description,
      contentType,
      posterUrl,
      cardUrl,
      genre,
      episodes: [],
      createdAt: new Date(),
      lastEpisodeAddedAt: new Date()
    });
    const savedShow = await newShow.save();
    return res.status(201).json(savedShow);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to create asset card: ' + err.message });
  }
});


// =========================================================================
// LEVEL 2: DYNAMIC PARAMETER ROUTES (Must sit below your static routes!)
// =========================================================================

/**
 * @route   GET /api/shows/:id
 * @desc    Get a single show by its ID (For the individual show page)
 */
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Show Not Found' });
    }
    return res.json(show);
  } catch (err) {
    return res.status(500).json({ message: 'Server error fetching this show' });
  }
});

/**
 * @route   POST /api/shows/:id/comments
 * @desc    Public / User: Submit a fresh comment to a show's queue for admin review
 */
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text cannot be blank." });
    }

    const submissionUsername = req.body.username || "Guest Fan";

    const newCommentObject = {
      username: submissionUsername,
      text: text.trim(),
      isApproved: false,
      createdAt: new Date(),
      replies: []
    };

    const updatedShow = await Show.findByIdAndUpdate(
      id,
      { $push: { comments: newCommentObject } },
      { returnDocument: 'after', runValidators: false }
    );

    if (!updatedShow) {
      return res.status(404).json({ message: "Show title profile not found." });
    }

    return res.status(201).json({ success: true, item: newCommentObject });
  } catch (err) {
    console.error("Backend Comment Submission Error:", err);
    return res.status(500).json({ message: "Server failed to process comment: " + err.message });
  }
});

/**
 * @route   POST /api/shows/:id/add-episode
 * @desc    Add an episode / movie direct mirror (SECURED)
 */
router.post('/:id/add-episode', protectAdmin, async (req, res) => {
  const { title, streamUrl, downloadUrl } = req.body;
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ message: 'Content Not Found!' });
    }

    let newEpisodeObject = { title, streamUrl, downloadUrl };

    if (show.contentType !== 'movie') {
      newEpisodeObject.episodeNumber = show.episodes.length + 1;
    }

    const updatedShow = await Show.findByIdAndUpdate(
      req.params.id,
      {
        $push: { episodes: newEpisodeObject },
        $set: { lastEpisodeAddedAt: new Date() }
      },
      {
        new: true,
        runValidators: false
      }
    );

    return res.status(201).json(updatedShow);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to add episode: ' + err.message });
  }
});

// =========================================================================
// LEVEL 3: MULTI-PARAM SUB-RESOURCES (Specific complex moderation routes)
// =========================================================================

/**
 * @route   PUT /api/shows/:showId/comments/:commentId/approve
 * @desc    Admin Panel: Approve a fan comment to make it visible to the public
 */
router.put('/:showId/comments/:commentId/approve', protectAdmin, async (req, res) => {
  try {
    const { showId, commentId } = req.params;

    const show = await Show.findOneAndUpdate(
      { _id: showId, "comments._id": commentId },
      { $set: { "comments.$.isApproved": true } },
      { returnDocument: 'after', runValidators: false }
    );

    if (!show) return res.status(404).json({ message: "Target comment record not found." });
    return res.status(200).json({ success: true, message: "Comment approved for public view!" });
  } catch (err) {
    return res.status(500).json({ message: "Approval transaction failed: " + err.message });
  }
});

/**
 * @route   POST /api/shows/:showId/comments/:commentId/reply
 * @desc    Admin Panel: Append an official administrator reply to a specific comment
 */
router.post('/:showId/comments/:commentId/reply', protectAdmin, async (req, res) => {
  try {
    const { showId, commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Reply text content cannot be blank." });
    }

    const newReplyObject = {
      username: 'Admin 🛡️',
      text: text.trim(),
      createdAt: new Date()
    };

    const updatedShow = await Show.findOneAndUpdate(
      { _id: showId, "comments._id": commentId },
      {
        $set: { "comments.$.isApproved": true },
        $push: { "comments.$.replies": newReplyObject }
      },
      { returnDocument: 'after', runValidators: false }
    );

    if (!updatedShow) {
      return res.status(404).json({ message: "Target comment profile could not be found." });
    }
    return res.status(201).json({ success: true, item: newReplyObject });
  } catch (err) {
    return res.status(500).json({ message: "Failed to submit administrator reply: " + err.message });
  }
});

/**
 * @route   PUT /api/shows/:id/schedule-live
 * @desc    Admin Panel: Lock brand new episode premiere details onto independent Live fields
 * @access  Private / Admin
 */
router.put('/:id/schedule-live', protectAdmin, async (req, res) => {
    try {
        const { episodeTitle, streamUrl, downloadUrl, liveStartTime, durationInSeconds } = req.body;

        const updatedShow = await Show.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    isLiveScheduled: true,
                    liveEpisodeTitle: episodeTitle,
                    liveStreamUrl: streamUrl,
                    liveDownloadUrl: downloadUrl,
                    liveStartTime: liveStartTime ? new Date(liveStartTime) : null,
                    durationInSeconds: parseInt(durationInSeconds, 10) || 0
                } 
            },
            { returnDocument: 'after', runValidators: false }
        );

        if (!updatedShow) {
            return res.status(404).json({ message: 'Target content profile not found.' });
        }

        return res.status(200).json(updatedShow);
    } catch (err) {
        return res.status(500).json({ message: 'Failed to lock premiere schedule: ' + err.message });
    }
});

/**
 * @route   GET /api/shows/live-timetable
 * @desc    Get all active scheduled independent live shows calibrated with server time
 */
router.get('/live-timetable', async (req, res) => {
    try {
        const serverTimeMs = Date.now();

        // केवल लाइव के लिए शेड्यूल शो लें और उन्हें उनके स्टार्ट टाइम के हिसाब से क्रम में लगाएं
        const liveShows = await Show.find({ isLiveScheduled: true })
                                    .sort({ liveStartTime: 1 })
                                    .lean();

        return res.status(200).json({
            serverTimeMs, // फ्रंटएंड क्लॉक ड्रिफ्ट को सिंक करने का मुख्य इंजन
            schedule: liveShows
        });
    } catch (err) {
        console.error("📋 Live Timetable Matrix Fetch Error:", err);
        return res.status(500).json({ 
            message: 'Server error while generating live timetable: ' + err.message 
        });
    }
});


module.exports = router;
