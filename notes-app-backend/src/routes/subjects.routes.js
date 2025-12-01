const express = require('express');
const router = express.Router();
const SubjectsController = require('../controllers/subjects.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', SubjectsController.getAllSubjects);
router.get('/:id', SubjectsController.getSubjectById);
router.post('/', SubjectsController.createSubject);
router.put('/:id', SubjectsController.updateSubject);
router.delete('/:id', SubjectsController.deleteSubject);

module.exports = router;