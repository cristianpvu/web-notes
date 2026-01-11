require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const errorHandler = require('./src/middleware/errorHandler');

const authRoutes = require('./src/routes/auth.routes');
const notesRoutes = require('./src/routes/notes.routes');
const subjectsRoutes = require('./src/routes/subjects.routes');
const tagsRoutes = require('./src/routes/tags.routes');
const attachmentsRoutes = require('./src/routes/attachments.routes');
const groupsRoutes = require('./src/routes/groups.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 },
}));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/groups', groupsRoutes);

app.use(errorHandler);

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}