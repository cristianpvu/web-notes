const express = require('express');
const router = express.Router();
const TagsController = require('../controllers/tags.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', TagsController.getAllTags);
router.post('/', TagsController.createTag);
router.put('/:id', TagsController.updateTag);
router.delete('/:id', TagsController.deleteTag);

module.exports = router;