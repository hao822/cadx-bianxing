'use strict';
var net = require('net');
var mysql = require('mysql');
let ejs = require('ejs');
let fs = require('fs');

// import a from '../view/index.ejs'
//创建tcp_server
var tcp_server = net.createServer();

//连接的地址信息
let socketList = [];

module.exports = function init() {
    // fs.readFile('data.json', 'utf8', function (err, data) {
    //     console.log('1111', JSON.parse(data));
    // })

    //监听端口
    tcp_server.listen(7005, function () {
        console.log('tcp_server listen 7005');
    })


    //处理客户端连接
    tcp_server.on('connection', function (socket) {
        socketList.push(socket.address())
        let ob = JSON.stringify(socketList)
        console.log('连接信息', socket.address(), socketList, ob, typeof (ob));
        // ejs.renderFile('../view/index.ejs', socketList, (err, data) => {
        //     console.log('err', err);//null没有错误
        //     console.log('daa', data);//渲染完成后的数据
        // })

        fs.writeFile('data.json', ob, function (err) {
            console.log('errrrr', err);
        })
        // fs.readFile('data.json', 'utf8', function (err, data) {
        //     console.log('1111', JSON.parse(data));
        // })

        //先给客户端发送连接信息
        var count = 0;
        var time12 = setInterval(function () {
            socket.write('[LINK_REQ]')
            count = count + 1;
            // console.log('count', count);
            if (count == 50) {
                clearInterval(time12)
                socket.write('Service connection timeout,请断开重新连接')
            }
        }, 1500)

        //读取客户端传来的数据
        socket.on('data', function (data) {
            data = data.toString();
            // console.log('data', data);
            if (data == '[LINK_ACK]') {
                //连接成功
                // console.log('success');
                clearInterval(time12);
                socket.write('Service connection success')

            } else {
                if (data.includes('isbiaozhun')) {
                    data = data.replace('[', '');
                    data = data.replace(']', '');
                    data = data.replace('{', '');
                    data = data.replace('}', '')
                    data = data.split(',')
                    var key = [];
                    var value = [];
                    for (var i = 0; i < data.length; i++) {
                        var num = data[i].indexOf(':');
                        var num1 = data[i].indexOf('"');
                        var num2 = data[i].lastIndexOf('"');
                        key.push(data[i].substring(0, num))
                        value.push(data[i].substring(num1 + 1, num2))
                    }
                    // console.log('存入数据库', data[0], key, value);
                    const returnData = {
                        ID: value[0],
                        isbiaozhun: value[1],
                        X001: value[2],
                        X002: value[3],
                        X003: value[4],
                        X004: value[5]
                    }
                    // console.log('returnData', returnData);


                    //创建库连接
                    var connection = mysql.createConnection({
                        host: '39.100.65.255',
                        // host: '47.93.230.161',
                        user: 'building_user',
                        // user: 'root',
                        password: 'building123',
                        // password: 'yue825822',
                        database: 'building'
                    });
                    connection.connect();

                    //库操作
                    let sql = "INSERT INTO lfdata SET ?"
                    let sql1 = "DELETE FROM lfdata WHERE isbiaozhun=1"

                    if (returnData.isbiaozhun == 1) {
                        connection.query(sql1, (err, result) => {
                            if (err) {
                                console.log('err', err);
                            } else {
                                console.log('result', result);
                                connection.query(sql, returnData, (err, result) => {
                                    if (err) {
                                        socket.write(err + '');
                                    } else {
                                        socket.write('[RETU]')
                                    }
                                })
                            }
                        })
                    } else {
                        connection.query(sql, returnData, (err, result) => {
                            if (err) {
                                socket.write(err + '');
                            } else {
                                socket.write('[RETU]')
                            }
                        })
                    }
                    connection.end();
                } else {
                    clearInterval(time12);
                    socket.write('Service connection fail')
                }

            }
        })
    })

    tcp_server.on('end', function () {
        console.log('tcp_server end!');
        clearInterval(time12)
    })

    tcp_server.on('error', function () {
        console.log('tcp_server error!');
        clearInterval(time12)
    })
}