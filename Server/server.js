require('dotenv').config()
const app = require('express')();
const server = require('http').createServer(app)
const mongoose = require('mongoose')

const io = require('socket.io')(server, {
    cors: {
        origin: "*",
    },
})

// Validate IP
const validate_IP = (ip) => {
    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if(ip.match(ipformat)){
        return true;
    }else{
        return false;
    }
}

// Database Schema
const Schema = mongoose.Schema;

const ips_model = new mongoose.Schema({
    ip: {type: String, default: "192.168.0.0"}
})

const Ips = mongoose.model('ip', ips_model)


// PORT 
const port = process.env.PORT || 5000;


// Establish Connection with client using socket.io
io.on("connection" , async(socket)=> {
    console.log(`Socket ID: ${socket.id}`)
    console.log(`Socket is active to be connected`)

    // Read
        Ips.find({}, (err, found)=>{
            const data_array = Object.values(found)
            console.log(data_array.length);
            console.log(data_array[0].ip);
            
              socket.emit("data_read", data_array)
          }).clone()

    // Create
    socket.on("data_create", (payload) => {
        const ip_new = payload
        if(validate_IP(ip_new)){
            const newIP = new Ips({
                ip: ip_new
            })
            newIP.save((err)=>{
                if(err){
                    console.log(err)
                }
            })
            socket.emit("validation", "IP Added successfully")
        }else{
            socket.emit("validation", "Not a valid IP")
        }
        
    })
    
    // Update
    socket.on("data_update", (payload)=>{
        const old = payload.old
        const new_IP = payload.new

        if(validate_IP(new_IP)){
            Ips.findOne({ip: old}, (err, foundIP)=>{
                if(!err){
                    console.log("foundIP: " + foundIP)
                    foundIP.ip = new_IP;
                    socket.emit("validation_update", "IP updated successfully")
                }
                foundIP.save((err)=>{
                    if(err){
                        console.log(err)
                    }
                })
            })
        }else{
            socket.emit("validation_update", "Not a valid IP")
        }
    })

    // Delete
    socket.on("data_delete", (payload)=>{
        const ip = payload

        Ips.findOneAndDelete({ip: ip}, (err, result)=>{
            if(err){
                console.log(err);
            }else{
                console.log(result);
            }
        });
    })
})







// mongodb connection
const connection = mongoose.connect(process.env.MONGO)
        .then(db => {
            console.log("Database Connected");
            return db;
        }).catch(err => {
            console.log("Connection Error");
        })


//     // listen to the http server 
    server.listen(port, ()=>{
        console.log(`Server is listening at port ${port}...`)
    })





