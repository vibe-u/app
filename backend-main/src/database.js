import mongoose from "mongoose";

mongoose.set("strictQuery", true);

const connection = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI);

        console.log(`Database connected on ${db.connection.host}`);
        console.log("✅ MongoDB conectado correctamente.");
        return db;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
};

export default connection;
