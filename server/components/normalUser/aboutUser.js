const { pool } = require('../../db');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

exports.updatePassword = async (req,res)=>{
    const errors=validationResult(req);
    
    if(!errors.isEmpty()){
        res.status(400).json({errors:errors.array()});
    }else{
        const {currentPassword,newPassword}=req.body;
        const userId=req.user.id;
        const user=await pool.query('SELECT password FROM users WHERE id=$1',[userId]);
        if(user.rows.length===0){
            res.status(404).json({message:'User not found'});
        }else{
            const match=await bcrypt.compare(currentPassword,user.rows[0].password);
            if(!match){
                res.status(400).json({message:'Current password is incorrect'});
            }else{
                const salt=await bcrypt.genSalt(10);
                const newHashed=await bcrypt.hash(newPassword,salt);
                await pool.query('UPDATE users SET password=$1 WHERE id=$2',[newHashed,userId]);
                res.json({message:'Password updated successfully'});
            }
        }
    }
};

exports.getCurrentUser=async(req,res)=>{
    const userId=req.user.id;
    const result=await pool.query('SELECT id,name,email,address,role FROM users WHERE id=$1',[userId]);
    if(result.rows.length===0){
        res.status(404).json({message:'User not found'});
    }else{
        let user=result.rows[0];
        
        if(user.role==='store_owner'){
            const storeRes=await pool.query('SELECT id,name,email,address FROM stores WHERE owner_id=$1',[userId]);
            if(storeRes.rows.length>0){
                user.store=storeRes.rows[0];
                const rateRes=await pool.query('SELECT AVG(rating) as average_rating FROM ratings WHERE store_id=$1',[user.store.id]);
                user.store.average_rating=Number(rateRes.rows[0].average_rating)||0;
            }
        }
        res.json(user);
    }
};
