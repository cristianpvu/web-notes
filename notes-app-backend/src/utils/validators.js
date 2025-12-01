const validateEmail = (email) => {
  return email.endsWith('@stud.ase.ro');
};

const validateNoteData = (data) => {
  if (!data.title || data.title.trim().length === 0) {
    throw new Error('Titlul este obligatoriu');
  }
  if (!data.content || data.content.trim().length === 0) {
    throw new Error('Conținutul este obligatoriu');
  }
  return true;
};

const validateGroupPermission = (permission) => {
  const validPermissions = ['read', 'edit'];
  if (!validPermissions.includes(permission)) {
    throw new Error('Permisiune invalidă. Folosește: read sau edit');
  }
  return true;
};

const validateGroupRole = (role) => {
  const validRoles = ['admin', 'editor', 'viewer'];
  if (!validRoles.includes(role)) {
    throw new Error('Rol invalid. Folosește: admin, editor sau viewer');
  }
  return true;
};

module.exports = {
  validateEmail,
  validateNoteData,
  validateGroupPermission,
  validateGroupRole,
};