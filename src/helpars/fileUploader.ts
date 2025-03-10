import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const eventStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads/events/'));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const profile = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads/profile/'));
  },
  filename: async function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });
const eventUpload = multer({ storage: eventStorage });
const uploadprofile = multer({ storage: profile });

const uploadprofileImage = uploadprofile.single('profileImage');
const uploadEventImage = eventUpload.single('eventImage');
const uploadPostImage = upload.single('postImage');

export const fileUploader = {
  upload,
  uploadprofileImage,
  uploadEventImage,
  uploadPostImage,
};
