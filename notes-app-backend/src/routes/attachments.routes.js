const express = require('express');
const router = express.Router();
const AttachmentsController = require('../controllers/attachments.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/notes/:noteId', AttachmentsController.uploadAttachment);
router.get('/notes/:noteId', AttachmentsController.getNoteAttachments);
router.get('/:id', AttachmentsController.getAttachmentById);
router.delete('/:id', AttachmentsController.deleteAttachment);

module.exports = router;