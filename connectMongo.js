import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.set("strictQuery", true)

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connect to MongoDB successfully");
    } catch (error) {
        console.log("Connect failed " + error.message );
    }
};

export default connectDB;
