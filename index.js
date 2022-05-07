const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
require('dotenv').config();
var jwt = require('jsonwebtoken');

const app = express();

const PORT = process.env.PORT || 5000;

//middlewere 
app.use(cors())
app.use(express.json());

// jwt 
function verifyJWT(req,res,next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(403).send({message:'forbidden access'})
        }
        // console.log('decoded', decoded)
        req.decoded=decoded;
        next()
    })
    // console.log('inside veryfied jwt',authHeader)
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gtyxm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('genious-car-service').collection('service')
        const orderCollection = client.db('genious-car-service').collection('order')
          
        // AUTH 
        app.post('/login',async(req,res)=>{
          const user = req.body;
          const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
              expiresIn:'1d'
          });
          res.send({accessToken});
        })

        //(crud) service API table / collection / schema

        //all data load from database
       app.get('/service',async(req,res)=>{
        const query ={};
        const cursor = serviceCollection.find(query)
        const services = await cursor.toArray();
        res.send(services)
       })
       //single data loade based on param
       app.get('/service/:id',async(req,res)=>{
           const id = req.params.id;
           const query= {_id: ObjectId(id)}
           const service = await serviceCollection.findOne(query);
           res.send(service)
       })
       // post 
       app.post('/service',async(req,res)=>{
           const newService = req.body;
           const result = await serviceCollection.insertOne(newService);
           res.send(result)
       })
        // delete 
        app.delete('/service/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)}
            const result = await serviceCollection.deleteOne(query);
            res.send(result)
        })
          //(crud) order api table / collection / schema

        app.get('/order',verifyJWT, async(req,res)=>{
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
           if(email === decodedEmail){
            const query = {email};
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
           }
           else{
               res.status(403).send({message:'forbidden access'})
           }
        })

        app.post('/order', async(req,res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })
    }
    finally{

    }
}run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('home')
})
app.listen(PORT,()=>{
    console.log(`server running ${PORT}`)
})
