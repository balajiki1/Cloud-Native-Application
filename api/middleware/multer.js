import multer from "multer"
import {setResponse} from "../controllers/index.js";
// Setting up multer to accept image files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "--" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if((file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg')){
        cb(null, true);
    } else{
        // cb(null, false)
        // req.isValidImage=false
        cb(new Error('Invalid file type. Only JPEG and PNG files are allowed.'), false);
    }

};

export const upload = multer({ storage: storage, fileFilter: fileFilter}).single("image")
export const uploadFile = function (req, res, next) {
    const upload = multer({ storage: storage, fileFilter: fileFilter}).single('image')

    console.log(upload)
    upload(req, res, function (err) {
        // if (err instanceof multer.MulterError) {
        //     // A Multer error occurred when uploading.
        //     return setResponse({message: err.message}, 400, res)
        // }
        // else
        if (err) {
            // An unknown error occurred when uploading.
            return setResponse({message: err.message}, 400, res, "warn")
        }
        next()
    })
}