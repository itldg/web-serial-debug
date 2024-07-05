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

## 使用方法

先选择一个电脑连接的串口

调整串口参数后打开串口即可开始通讯

中间区域是串口日志,可以选择 HEX 或者 ASCII 显示

下方是发送区域,可以选择 HEX 或者 ASCII 发送,定时循环发送

右侧可以自己添加一些常用指令,快捷发送

## 开源

代码凌乱不堪，无学习价值

希望各位大佬可以协助添砖加瓦，让其更加完善

常用的朋友也可以提交一些常用的指令集,后续做一下常用指令集的整理

开源地址：[GitHub](https://github.com/itldg/web-serial-debug) | [Gitee](https://gitee.com/itldg/web-serial-debug)
