const express = require("express");
const {
  rejectUnauthenticated,
} = require("../modules/authentication-middleware");
const router = express.Router();
const pool = require("../modules/pool");
const query = require("express/lib/middleware/query");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/************************** SIGNED URL **************************/
router.get("/signed-url", rejectUnauthenticated, async (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const cloud_name = cloudinary.config().cloud_name;
  const api_key = cloudinary.config().api_key;
  console.log(api_key, "api_key router")
  const api_secret = cloudinary.config().api_secret;
  const upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      upload_preset,
    },
    api_secret
  );
  res.json({ // Response (JSON)
    timestamp,
    signature,
    cloud_name,
    api_key,
    upload_preset,
  });
});
/************************** MEDIA TYPE VARIABLES **************************/
const mediaType = { // Refers to table in database
  photo: 1,
  video: 2,
  photoLetter: 3,
  textLetter: 4,
  voice: 5,
};
/************************** POST VOICE NOTE **************************/
router.post("/voice", rejectUnauthenticated, (req, res) => {
  const user = req.user.id;
  console.log("userId:", user);

  const { box_id, /*public_id,*/ secure_url } = req.body;
  console.log("req.body", req.body);

  const queryText = `
    INSERT INTO "box_item",
    VALUES 
      "box_id" = $1,
      "user_id" = $2,
      "media_url" = $3,
      "media_type" = $4,
      "public_id" = $5;
  `;

  const queryValues = {
    box_id: box_id,
    user_id: user,
    media_url: secure_url,
    media_type: mediaType.voice,
    public_id: public_id,
  };

  pool
    .query(queryText, queryValues)
    .then((result) => {
      res.sendStatus(201);
    })
    .catch((err) => {
      console.log("Error in POST VOICE NOTE :", err);
      res.sendStatus(500);
    });
});
/************************** POST PHOTO **************************/
router.post("/upload/image", rejectUnauthenticated, (req, res) => {
  const user = req.user;
  const { box_id, public_id, secure_url } = req.body;
  const queryText = `
    INSERT INTO "box_item",
    VALUES
      "box_id" = $1,
      "user_id" = $2,
      "media_url" = $3,
      "media_type" = $4,
      "public_id" = $5;
  `;
  const queryValues = {
    box_id: box_id,
    user_id: user,
    media_url: secure_url,
    media_type: mediaType.image,
    public_id: public_id,
  };
  pool
    .query(queryText, queryValues)
    .then((res) => {
      res.sendStatus(201);
    })
    .catch((err) => {
      console.log("Error in POST IMAGE NOTE :", err);
      res.sendStatus(500);
    });
});
//Get Images
router.get("/images", rejectUnauthenticated, async (req, res) => {
  const queryText = `
    SELECT * FROM "box_item" WHERE "media_type" = $1;
  `;
  const queryValues = [mediaType.photo];
  
  try {
    const result = await pool.query(queryText, queryValues);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching images:", err);
    res.sendStatus(500);
  }
});


/************************** POST VIDEO **************************/

router.delete('/video/:id', rejectUnauthenticated, (req, res) => {
  const userId = req.params.id
  console.log(userId);
  
  const queryText = `DELETE FROM "box_item" WHERE "id" = $1;`;
  pool.query(queryText, [userId]).then((r) => {
    res.sendStatus(200)
  }).catch((e) => {
    console.log('Error in server-side DELETE request for video', e);
  })
})

router.put('/video/:id', rejectUnauthenticated, (req, res) => {
  const userId = req.params.id
  const upload = req.body.upload
  
  const queryText = `UPDATE "box_item" SET "description" = $1 WHERE "id" = $2;`;
  pool.query(queryText, [upload, userId]).then((r) => {
    res.sendStatus(200)
  }).catch((e) => {
    console.log('Error in server-side PUT request', e);
  })


  
})
/************************** POST (PHOTO) LETTER **************************/
/************************** POST (TEXT) LETTER **************************/
module.exports = router;