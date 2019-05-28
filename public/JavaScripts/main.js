$(function () {
    let _username = null;
    let _$inputname = $('#name');
    let _$loginButton = $('#loginbutton');
    let _$number = $('.number');
    let _$content = $('#content');
    let _$chatinput = $('#chatinput');
    let _$inputGroup = $('#inputgroup');
    let _$imgButton = $('#imgbutton');
    let _$imgInput = $('#imginput');
    let _$listGroup = $('.list-group');
    let _touXiangUrl = null;
    let _to = null;

    let socket = io.connect();
    //随机设置头像地址
    let touXiang = function () {
        let _url = Math.random() * 8 | 0;
        switch (_url) {
            case 0:
                return "icon-river__easyiconnet1";
            case 1:
                return "icon-river__easyiconnet";
            case 2:
                return "icon-photo_camera__easyiconnet";
            case 3:
                return "icon-planet_earth__easyiconnet";
            case 4:
                return "icon-palace__easyiconnet";
            case 5:
                return "icon-mountain__easyiconnet";
            case 6:
                return "icon-parachute__easyiconnet";
            case 7:
                return "icon-map__easyiconnet";
            case 8:
                return "icon-mountains__easyiconnet";
            case -1:
                return "icon-yonghu"
        }
    };
    initModal = function (event) {
        _to = $(event.target).attr('name');
        $("#myModalLabel").text(`发给${_to}`);
    }
    //设置用户名，当用户登录时触发
    let setUsername = function () {
        _username = _$inputname.val().trim();
        _touXiangUrl = touXiang();
        if (_username) {
            socket.emit('login', {username: _username, touXiangUrl: _touXiangUrl});
        }
    };
    //隐藏登录框，显示聊天界面
    let beginChat = function (data) {
        $('#loginbox').hide('slow');
        _$inputname.off('keyup');
        _$loginButton.off('click');
        $(`<h2 style="text-align: center">${_username}的聊天室</h2>`).insertBefore($('#content'));
        $(`<span style="color: red">欢迎您${_username}!</span>`).insertBefore($('#content'));
        $('#chatbox').show('slow');
        /* 用户列表渲染，首先清空列表
        * 先添加自己，在从data中找到别人添加进去*/
        _$listGroup.empty();
        _$listGroup.append(`<a href="#" name="${_username}" class="list-group-item disabled"><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#icon-yonghu"></use></svg>&nbsp;&nbsp;${_username}</a>`);
        //添加别人
        for (let _user of data.userGroup) {
            if (_user.username !== _username) {
                _$listGroup.append(`<a href="#" name="${_user.username}" class="list-group-item" data-toggle="modal" data-target="#myModal"><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#${_user.touXiangUrl}"></use></svg>&nbsp;&nbsp;${_user.username}</a>`);
            }
        }
    };
    /*得到输入框的信息，将信息和用户名发送过去*/
    let sendMessage = function () {
        let _message = _$chatinput.val();
        _message = $.emojiParse({
            content: _message,
            emojis: [
                {type: 'qq', path: 'static/images/qq/', code: ':'},
                {path: 'static/images/tieba/', code: ';', type: 'tieba'},
                {path: 'static/images/emoji/', code: ',', type: 'emoji'}]
        });
        if (_message) {
            socket.emit('sendMessage', {username: _username, message: _message, touXiangUrl: _touXiangUrl});
        }
    };
    //先判断这个消息是不是自己发出的，然后再以不同样式显示
    let showMessage = function (data) {
        if (data.username === _username) {
            $('#content').append(`<div class="receiver" style="overflow: auto">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#icon-yonghu"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">
                                            ${data.username}
                                        </strong>
                                    </div>
                                    <div>
                                        <div class="right_triangle"></div>
                                        <span style="text-align: center">${data.message}</span>
                                    </div>
                                </div>`);
        } else {
            $('#content').append(`<div class="sender" style="overflow: auto">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#${data.touXiangUrl}"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">${data.username}</strong>
                                    </div>
                                    <div>
                                        <div class="left_triangle"></div>
                                        <span style="text-align: center">${data.message}</span>
                                    </div>
                                    
                                </div>`);
        }
        _$content.scrollTop(_$content[0].scrollHeight);
    };
    //发送图片
    let sendImg = function (event) {
        if (typeof FileReader === 'undefined') {
            _$imgButton.attr('disabled', 'disabled');
        } else {
            let file = event.target.files[0];
            if (!/image\/\w+/.test(file.type)) {
                alert('请选择图片');
                return false;
            }
            //使用FileReader读取文件
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function (e) {
                socket.emit('sendImg', {username: _username, dataUrl: this.result, touXiangUrl: _touXiangUrl});
            }
        }
    };
    //显示图片
    let showImg = function (data) {
        if (data.username === _username) {
            $('#content').append(`<div class="receiver" style="overflow: auto">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#icon-yonghu"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">
                                            ${data.username}
                                        </strong>
                                    </div>
                                    <div>
                                        <div class="right_triangle"></div>
                                        <span><img class="img-thumbnail" src="${data.dataUrl}" style="max-height: 100px; text-align: center"/></span>
                                    </div>
                                </div>`);
        } else {
            $('#content').append(`<div class="sender" style="overflow: auto">
                                    <div>
                                        <svg class="icon img-circle" aria-hidden="true" style="font-size: 2em;">
                                            <use xlink:href="#${data.touXiangUrl}"></use>
                                        </svg>
                                        <strong style="font-size: 1.5em;">${data.username}</strong>
                                    </div>
                                    <div>
                                        <div class="left_triangle"></div>
                                        <span><img class="img-thumbnail" src="${data.dataUrl}" style="max-height: 100px; text-align: center"/></span>
                                    </div>                               
                                </div>`);
        }
        _$content.scrollTop(_$content[0].scrollHeight);
    };
    /*flag为1代表好友上线，-1代表好友下限
    * data存储用户信息*/
    let comeAndLeave = function (flag, data) {
        if (flag === 1) {
            $('#content').append(`<p style="text-align: center">您的好友<strong>${data.username}</strong>上线了!</p>`);
            _$listGroup.append(`<a href="#" name="${data.username}" class="list-group-item"  data-toggle="modal" data-target="#myModal"><svg class="icon" aria-hidden="true" style="font-size: 2em"><use xlink:href="#${data.touXiangUrl}"></use></svg>${data.username}</a>`);
        } else {
            $('#content').append(`<p style="text-align: center">您的好友<strong>${data.username}</strong>下线了!</p>`);
            _$listGroup.find($(`a[name='${data.username}']`)).remove();
        }
    };

    //登录事件
    _$loginButton.on('click', function () {
        setUsername();
    });
    _$inputname.on('keyup', function (event) {
        if (event.keyCode === 13) {
            setUsername();
        }
    });
    //聊天事件
    _$chatinput.on('keyup', function (event) {
        if (event.keyCode === 13) {
            sendMessage();
            _$chatinput.val('');
        }
    });
    _$imgButton.on('click', function () {
        _$imgInput.click();
        return false;
    });
    _$imgInput.change(function (event) {
        sendImg(event);
        $('#resetform')[0].reset();
    });
    //监听成员点击事件
    _$listGroup.on('click', function (event) {
        initModal(event);
    });
    //监听私聊的按钮，触发私聊事件
    $("#sendtoo").on('click', function(event) {
        let _text = $("#inputtoone").val();
        if (typeof _text !== 'undefined') {
            socket.emit('sendToOne', { to: _to, text: _text, username: _username });
            $("#inputtoone").val('');
            $("#closesendtoo").click();
        }
    });
    //socket.io部分逻辑
    socket.on('loginSuccess', (data) => {
        if (data.username === _username) {
            beginChat(data);
        } else {
            comeAndLeave(1, data)
        }
    });
    socket.on('usernameErr', (data) => {
        $(".login .form-inline .form-group").addClass("has-error");
        $('<label class="control-label" for="inputError1">用户名重复</label>').insertAfter($('#name'));
        setTimeout(function() {
            $('.login .form-inline .form-group').removeClass('has-error');
            $("#name + label").remove();
        }, 1500)
    });
    socket.on('count',(data) => {
        _$number.html(data);
    })
    socket.on('receiveMessage', (data) => {
        showMessage(data);
    });
    socket.on('receiveImg', (data) => {
        showImg(data);
    });
    socket.on('oneLeave', (data) => {
        comeAndLeave(-1, data);
    });
    socket.on('receiveToOne', (data) => {
        $("#myModalLabel1").text(`来自${data.username}`);
        $(".shoudao").text(`${data.text}`);
        $("#showmodal").click();
    });
})