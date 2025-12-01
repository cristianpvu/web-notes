const express = require('express');
const router = express.Router();
const NotesController = require('../controllers/notes.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', NotesController.getAllNotes);
router.get('/shared', NotesController.getSharedNotes);
router.get('/:id', NotesController.getNoteById);
router.post('/', NotesController.createNote);
router.put('/:id', NotesController.updateNote);
router.delete('/:id', NotesController.deleteNote);

router.post('/:id/share', NotesController.shareNote);
router.delete('/:id/share/:shareId', NotesController.unshareNote);

module.exports = router;