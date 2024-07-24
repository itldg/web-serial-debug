# Web Serial Debug

浏览器串口调试工具

仅测试了 Edge 和 Chrome 浏览器,其他浏览器未测试是否可用

在线体验: [https://itldg.github.io/web-serial-debug/](https://itldg.github.io/web-serial-debug/)

国内体验: [https://www.itldg.com/web_serial_debug/](https://www.itldg.com/web_serial_debug/)

## 界面预览

![界面预览](/imgs/main.png)

## 实现功能

-   自动重连,设备插拔自动重连
-   所有串口参数可设置更改,配置自动保存
-   串口日志支持 HEX 和 ASCII,自动滚动
-   分包合并,设定超时时间
-   快捷发送列表,自定义分组,快捷导入导出
-   配置文件导入导出,方便迁移
-   自定义脚本,支持发送和接收数据处理

## 使用方法

先选择一个电脑连接的串口

调整串口参数后打开串口即可开始通讯

中间区域是串口日志,可以选择 HEX 或者 ASCII 显示

下方是发送区域,可以选择 HEX 或者 ASCII 发送,定时循环发送

右侧可以自己添加一些常用指令,快捷发送

## 自定义脚本

自定义脚本可以在发送和接收数据时进行处理

脚本支持 JavaScript 语法,通过`postMessage`和`onmessage`进行通讯

如下是一个简单的脚本示例

```javascript
addEventListener('message', function ({data}) {
    if(data.type=='uart_receive')
    {
        postMessage({type:'log',data:'消息长度:'+data.data.length});
        //原文答复
        postMessage({type:'uart_send',data:data.data});
    }
})
setInterval(function(){
    //定时发送
    postMessage({type:'uart_send_txt',data:'hello world'});
},1000);
```

`onmessage`接收到的数据格式如下

```json
{
    "type":"uart_receive", //消息类型 String,目前仅支持 uart_receive
    "data":[0,1] //消息内容 Uint8Array
}
```

`postMessage`发送的数据格式如下

```json
{
    "type":"uart_send", 
    "data":[0,1]
}
```

| TYPE 类型     | DATA 数据格式 | 说明               |
| ------------- | ------------- | ------------------ |
| uart_send     | Uint8Array    | 发送字节数据       |
| uart_send_txt | String        | 发送文本数据       |
| uart_send_hex | String        | 发送十六进制字符串 |
| log           | String        | 打印日志           |


## 开源

代码凌乱不堪，无学习价值

希望各位大佬可以协助添砖加瓦，让其更加完善

常用的朋友也可以提交一些常用的指令集,后续做一下常用指令集的整理

开源地址：[GitHub](https://github.com/itldg/web-serial-debug) | [Gitee](https://gitee.com/itldg/web-serial-debug)
