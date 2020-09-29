let expo_url = "url";

let Exposure = {
  isSending: false,
  deviceObj: null,       // 设备对象
  scorllObj: null,       // 滚动条对象
  sendList: [],          // 已发送队列
  ExposureList: [],      // 曝光队列
  scrollRangMin: 50,     // 单位px
  ExposureClassName: 's-exposure-box', // 监控类
  ExposureVersion: "",
  bugSwitch: false,
  setAvailHeight: 400,

  init: function (parmas) {
    if (typeof (parmas['ExposureClassName']) != undefined && parmas['ExposureClassName'] != '') {
      this.ExposureClassName = parmas['ExposureClassName'];
    }
    if ($("." + this.ExposureClassName).length <= 0) return;
    // 首屏曝光id
    this.addScreenList();
    // 监听滚动条变化并绑定事件
    this.scrollCulExposure()
    // 初始化发送请求
    this.initSendExposure()
    // js加载时间
    this.ExposureVersionDate()
  },
  ExposureVersionDate: function () {
    this.ExposureVersion = this.getDateFitter();
    if (this.bugSwitch) {
      console.log(this.ExposureVersion)
    }
  },
  getDateFitter: function () {
    let myDate = new Date();
    let year = myDate.getFullYear();        //获取当前年
    let month = myDate.getMonth() + 1;   //获取当前月
    let date = myDate.getDate();            //获取当前日
    let h = myDate.getHours();              //获取当前小时数(0-23)
    let m = myDate.getMinutes();          //获取当前分钟数(0-59)
    let s = myDate.getSeconds();
    return year + '-' + this.getNow(month) + "-" + this.getNow(date) + " " + this.getNow(h) + ':' + this.getNow(m) + ":" + this.getNow(s);
  },
  getNow: function (s) {
    return s < 10 ? '0' + s : s;
  },
  initSendExposure: function () {
    let _self = this;
    setInterval(() => {
      _self.sendExposure();
    }, 1000);
  },
  // 滚动条变化事件   方法
  scrollCulExposure: function () {
    let _self = this;
    let lastScrollTop = _self.scollObj;
    $(window).scroll(function () {
      let scrollTop = _self.getScrollTop();
      let scrollRang = Math.abs(scrollTop - lastScrollTop);
      if (scrollRang > _self.scrollRangMin) {
        lastScrollTop = scrollTop;
        _self.addScreenList();
      }
    })
  },

  // 1、当滚动条变化大于XXX px时，计算一次曝光并存储
  addScreenList: function () {
    if ($("." + this.ExposureClassName).length <= 0) return;
    let idArr = this.getScreenExposureList();
    if (this.bugSwitch) {
      console.log("idArr:" + idArr)
    }
    this.addExposureList(idArr);
  },

  addExposureList: function (idArr) {
    if (!idArr instanceof Array || idArr.length <= 0 || idArr == null) return;
    // 循环idArr，判断是已在队列里面，不在就添加
    for (let i = 0; i < idArr.length; i++) {
      if (-1 == $.inArray(idArr[i], this.ExposureList)) {
        this.ExposureList.push(idArr[i]);
      }
    }
    if (this.bugSwitch) {
      console.log("ExposureList:" + this.ExposureList)
    }
  },

  // 获取曝光区域的id
  getScreenExposureList: function () {
    let _self = this;
    let curScreenIdArr = [];
    if ($("." + _self.ExposureClassName).length <= 0) {
      //removeScorllListinerEvent()
      return;
    }
    $("." + _self.ExposureClassName).each(function (index, curDomItem) {
      if (_self.isExposure(curDomItem)) {
        $(this).removeClass(_self.ExposureClassName);
        // 加入曝光队列
        if ($(this).data("id") <= 0) return;
        curScreenIdArr.push($(this).data("id"));
      }
    });
    if (this.bugSwitch) {
      console.log("curScreenIdArr:" + curScreenIdArr)
    }
    return curScreenIdArr;
  },

  // 是否曝光
  isExposure: function (domObj) {
    let $innerHeight = this.getCountHeight();//可视区域高度
    let $scrollTop = this.getScrollTop();//滚动条高度
    let $offsetTop = $(domObj).offset().top;//距离顶部偏移度
    let $offsetHeight = $(domObj)[0].offsetHeight;//真实高度
    if (this.bugSwitch) {
      console.log($innerHeight > 0)
    }
    if ($offsetTop < ($innerHeight + $scrollTop) && $offsetTop >= $scrollTop && $offsetHeight != 0 && $innerHeight > 0) {
      return true;
    } else {
      return false;
    }
  },

  // 获取屏幕高度
  getDeviceHeight: function () {
    //文档显示区的高度
    this.deviceObj = window.innerHeight;
    return window.innerHeight
  },

  // 计算高度
  getCountHeight: function () {
    let $innerHeight = this.getDeviceHeight();
    let $countHeight = Math.ceil($innerHeight * (2 / 3));
    // setAvailHeight = 460
    if ($countHeight > this.setAvailHeight) {
      return $countHeight
    } else {
      return $innerHeight
    }
  },

  getDeviceWidth: function () {
    return window.innerwidth
  },

  // 滚动条高度
  getScrollTop: function () {
    // 兼容写法：document.scrollingElement.scrollTop
    // 移动端，PC端有差异：$(window).scrollTop()
    let $win = document.scrollingElement.scrollTop;
    this.scollObj = $win;
    return $win;
  },

  // 发送曝光请求
  sendExposure: function () {
    if (this.isSending) return;
    this.isSending = true;
    let _self = this;
    let gameIdObj = _self.getSendGameIds();
    let userMessegGameObj = _self.userMesseg();//设备信息
    userMessegGameObj.ExposureVersion = _self.ExposureVersion;
    userMessegGameObj.game_id = gameIdObj;
    if (gameIdObj.length <= 0 || !gameIdObj instanceof Array) {
      _self.isSending = false;
      return;
    }
    _self.ajaxSend(userMessegGameObj, function () {
      _self.isSending = false;
      // if($("."+_self.ExposureClassName).length <= 0 && _self.ExposureList.length == _self.sendList.length){
      //     clearInterval
      // }
    });
  },

  getSendGameIds: function () {
    let sendIdArr = [];
    let exportList = this.ExposureList;
    for (let i = 0; i < exportList.length; i++) {
      if (-1 == $.inArray(exportList[i], this.sendList)) {
        this.sendList.push(exportList[i])
        sendIdArr.push(exportList[i]);
      }
    }
    if (this.bugSwitch) {
      console.log(sendIdArr)
    }

    return sendIdArr;
  },

  // 用户信息
  userMesseg: function () {
    let userMessegData = {
      "href": window.location.href,
      "ua": navigator.userAgent,
      "appName": navigator.appName,//浏览器的正式名称
      "appVersion": navigator.appVersion, //浏览器的版本号
      "cookieEnabled": navigator.cookieEnabled,//返回用户浏览器是否启用了cookie
      "platform": navigator.platform,//浏览器正在运行的操作系统平台
      "userClient": this.browserRedirect(),//客户端
      "datetime": this.getDateFitter(),//时间
      "DeviceWidth": window.screen.availWidth,
      "DeviceHeight": window.screen.availHeight//屏幕高度
    }
    return userMessegData;
  },

  // 判断PC，IOS，Android
  browserRedirect: function () {
    let sUserAgent = navigator.userAgent.toLowerCase();
    let bIsIpad = sUserAgent.match(/ipad/i) == "ipad";
    let bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os";
    let bIsMidp = sUserAgent.match(/midp/i) == "midp";
    let bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4";
    let bIsUc = sUserAgent.match(/ucweb/i) == "ucweb";
    let bIsAndroid = sUserAgent.match(/android/i) == "android";
    let bIsCE = sUserAgent.match(/windows ce/i) == "windows ce";
    let bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile";
    if (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM) {
      let u = navigator.userAgent;
      let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1; //g
      let isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
      if (isAndroid) {
        //这个是安卓操作系统
        return 'Android';
      }
      if (isIOS) {
        //这个是ios操作系统
        return "IOS";
      }
    } else {
      return "PC";
    }
  },


  ajaxSend: function (data, callback) {
    $.ajax({
      type: "POST",
      url: expo_url,//'http://127.0.0.1:3030/text/plain'
      data: data,
      dataType: "json",
      async: false,
      success: function (res) {
        // console.log("res");
        callback();
      },
      error: function (error) {
        // console.log("error"+JSON.stringify(error));
        callback();
      }
    });
  },
  clearIntervalScroll: function () {
    clearInterval(this.initSendExposure())
  }
};



//使用
window.onload = function () {
  //标记
  $(".s-dl-btn-box").each(function (index, dom) {
    //统计类
    $(this).addClass("s-exposure-box")
  })
  Exposure.init({ "ExposureClassName": "s-exposure-box" })
}