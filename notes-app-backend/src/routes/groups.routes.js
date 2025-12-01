const express = require('express');
const router = express.Router();
const GroupsController = require('../controllers/groups.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', GroupsController.getAllGroups);
router.get('/:id', GroupsController.getGroupById);
router.post('/', GroupsController.createGroup);
router.put('/:id', GroupsController.updateGroup);
router.delete('/:id', GroupsController.deleteGroup);

router.post('/:id/join', GroupsController.joinGroup);
router.post('/:id/leave', GroupsController.leaveGroup);
router.post('/:id/invite', GroupsController.inviteMember);
router.delete('/:id/members/:memberId', GroupsController.removeMember);
router.put('/:id/members/:memberId', GroupsController.updateMemberPermissions);

router.post('/:id/notes', GroupsController.addNoteToGroup);
router.delete('/:id/notes/:noteId', GroupsController.removeNoteFromGroup);

module.exports = router;