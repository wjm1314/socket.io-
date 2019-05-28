const express = require('express');  // const是ES6的语法，代表常量，准确来说就是指向不发生改变。如果不习惯就用var代替
const app = express();               // express官网就是这么写的就是用来创建一个express程序，赋值给app。如果不理解就当公式记住
const server = require('http').Server(app);
const path = require('path');        // 这是node的路径处理模块，可以格式化路径
const io = require('socket.io')(server);     //将socket的监听加到app设置的模块里。

const users = [];                    //用来保存所有的用户信息
let usersNum = 0;
const _sockets = [];                 //将socket和用户名匹配

server.listen(3000,()=>{                // ()=>是箭头函数，ES6语法，如果不习惯可以使用 function() 来代替 ()=>
    console.log("server running at 47.105.71.231:3000");       // 代表监听3000端口，然后执行回调函数在控制台输出。
});

app.get('/',(req,res)=>{
    res.redirect('/chat.html');       // express的重定向函数。如果浏览器请求了根路由'/',浏览器就给他重定向到 '127.0.0.1:3000/chat.html'路由中
});

app.use('/',express.static(path.join(__dirname,'./public')));

/*socket*/
io.on('connection',(socket)=>{              //监听客户端的连接事件
    /**
     * 所有有关socket事件的逻辑都在这里写
     */
    usersNum ++;
    socket.on('login',(data)=>{
        /**
         * 先保存在socket中
         * 循环数组判断用户名是否重复,如果重复，则触发usernameErr事件
         * 将用户名删除，之后的事件要判断用户名是否存在
         */
        socket.username = data.username;
        for (let user of users) {
            if(user.username === data.username){
                socket.emit('usernameErr',{err: '用户名重复'});
                socket.username = null;
                break;
            }
        }
        //如果用户名存在。将该用户的信息存进数组中
        if(socket.username){
            users.push({
                username: data.username,
                message: [],
                dataUrl: [],
                touXiangUrl: data.touXiangUrl
            });

            //保存socket
            _sockets[socket.username] = socket;
            //然后触发loginSuccess事件告诉浏览器登陆成功了,广播形式触发
            data.userGroup = users;         //将所有用户数组传过去
            io.emit('loginSuccess',data);   //将data原封不动的再发给该浏览器
        }
        io.emit('count',usersNum);
    });

    socket.on('sendMessage',(data)=>{
        for(let _user of users) {
            if(_user.username === data.username) {
                _user.message.push(data.message);
                //信息存储之后触发receiveMessage将信息发给所有浏览器
                io.emit('receiveMessage',data);
                break;
            }
        }
    });

    socket.on("sendImg",(data)=>{
        for(let _user of users) {
            if(_user.username === data.username) {
                _user.dataUrl.push(data.dataUrl);
                //存储后将图片广播给所有浏览器
                io.emit("receiveImg",data);
                break;
            }
        }
    });

    socket.on('sendToOne',(data)=>{
        //判断该用户是否存在，如果存在就触发receiveToOne事件
        for (let _user of users) {
            if (_user.username === data.to) {
                _sockets[data.to].emit('receiveToOne',data);
            }
        }
    });

    //断开连接后做的事情
    socket.on('disconnect',()=>{          //注意，该事件不需要自定义触发器，系统会自动调用
        usersNum --;
        io.emit('count',usersNum);
        //触发用户离开的监听
        socket.broadcast.emit("oneLeave",{username: socket.username});
        //删除用户
        users.forEach(function (user,index) {
            if(user.username === socket.username) {
                users.splice(index,1);       //找到该用户，删除
            }
        })
    })
});