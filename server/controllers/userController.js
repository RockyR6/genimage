import User from "../models/userModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import razorpay from 'razorpay'
import transactionModel from "../models/transactionModel.js";

// Register users
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if(!name || !email || !password) {
            return res.status(400).json({
                success: false, 
                message: 'Missing Details'
            })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            password: hashedPassword
        }

        const newUser = new User(userData)
        const user = await newUser.save()

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)

        res.status(201).json({
            success: true,
            token,
            user: {name: user.name}
        })
       
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Login users
export const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body
        const user = await User.findOne({email})

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User does not exist'
            })
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password)

        if(!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
        res.json({
            success: true, 
            token, 
            user: {name: user.name}
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

//get user credits
export const userCredits = async(req, res) => {
    try {
        const {userId} = req.body

        const user = await User.findById(userId)
        res.status(200).json({
            success: true,
            credits: user.creditBalance,
            user: {name: user.name}
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

export const paymentRazorpay = async(req, res) => {
    try {
        const { userId, planId } = req.body

        const userData = await User.findById(userId)

        if(!userId || !planId){
            return res.status(400).json({
                success: false,
                message: 'Missing Details'
            })
        }

        let credits, plan, amount, date

        switch (planId) {
            case 'Basic':
                plan = 'Basic'
                credits = 10
                amount = 10
                break;

            case 'Advanced':
                plan = 'Advanced'
                credits = 60
                amount = 50
                break;  
                
            case 'Business':
                plan = 'Business'
                credits = 300
                amount = 250
                break;     
        
            default:
                return res.status(500).json({
                    success: false,
                    message: 'plan not found'
                });
        }

        date = Date.now();

        const transactionData = {
            userId, plan, amount, credits, date
        }

        const newTransaction = await transactionModel.create(transactionData)

        const options = {
            amount: amount * 100,
            currency: process.env.CURRENCY,
            receipt: newTransaction._id
        }

        await razorpayInstance.orders.create(options, (error, order) => {
            if(error){
                console.log(error);
                return res.json({success: false, message: error})
                
            }

            res.json({success: true, order})
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false, 
            message: error.message
        })
        
    }
}

export const verifyRazorpay = async (req, res) => {
   try {
    const {razorpay_order_id} = req.body
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

    if(orderInfo.status === 'paid'){
        const transactionData = await transactionModel.findById(orderInfo.receipt)
        if(transactionData.payment){
            return res.json({success:false, message:'Payment Failed'})
        }

        const userData = await User.findById(transactionData.userId)

        const creditBalance = userData.creditBalance + transactionData.credits
        await User.findByIdAndUpdate(userData._id, {creditBalance})
        await transactionModel.findByIdAndUpdate(transactionData._id, {payment: true})
        res.json({success:true, message:"Credits Added"})
    }else{
        res.json({success: false, message: 'Payment Failed'})
    }


    

   } catch(error) {
    console.log(error);
    res.json({success: false, message: error.message})
    
   }
}