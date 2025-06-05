import jwt from 'jsonwebtoken'


const userAuth = async(req, res, next) => {
    const {token} = req.headers

    if(!token){
        return res.status(400).json({
            success: false, 
            message: 'Not Authorized Login Again'
        })
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)

        if(tokenDecode.id){
            req.body = req.body || {};
            req.body.userId = tokenDecode.id// here i match the token id(come from token generate jwt.sign({id: user._id}) which is basicaly user id and store it on userId
        }else{
            return res.status(400).json({
                success:false,
                message:'Not Authorized. Login again'
            })
        }

        next()

    } catch (error) {
         console.log(error);
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


export default userAuth;