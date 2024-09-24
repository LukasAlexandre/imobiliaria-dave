import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.set("strictQuery", true)

const connectDB = async () => {
    try {
        await mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@server-imob.stodyvc.mongodb.net/${process.env.NAME_BASE_URL}?retryWrites=true&w=majority&appName=server-imob`);
        console.log("Connect to MongoDB successfully");
    } catch (error) {
        console.log("Connect failed " + error.message );
    }
};

export default connectDB;
