import express from 'express'
import cors from 'cors'
import 'dotenv/config'

import connectDB from './config/mongodb.js'
import userRouter from './routes/userRoute.js'
import imageRouter from './routes/imageRoutes.js'

const PORT = process.env.PORT || 4000
const app = express()

// 1. First connect to DB
await connectDB()

// 2. Middleware
app.use(cors()) 
app.use(express.json())

// 3. Routes
app.use('/api/user', userRouter)
app.use('/api/image', imageRouter)

// 4. Basic route
app.get('/', (req, res) => res.send("API working"))

// 5. Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

if(process.env.NODE_ENV !== "production"){
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

//Export server for Versel
export default server;