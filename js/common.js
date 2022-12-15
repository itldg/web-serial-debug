;(function () {
	if (!('serial' in navigator)) {
		alert('当前浏览器不支持串口操作,请更换Edge或Chrome浏览器')
	}
	let serialPort = null
	navigator.serial.getPorts().then((ports) => {
		serialPort = ports[0]
	})
	let reader
	//串口目前是打开状态
	let serialOpen = false
	//串口目前是手动关闭状态
	let serialClose = true
	//串口分包合并时钟
	let serialTimer = null
	//串口循环发送时钟
	let serialloopSendTimer = null
	//串口缓存数据
	let serialData = []
	//文本解码
	let asciidecoder = new TextDecoder()
	//工具配置
	let toolOptions = {
		//自动滚动
		autoScroll: true,
		//显示时间 界面未开放
		showTime: true,
		//日志类型
		logType: 'hex&ascii',
		//分包合并时间
		timeOut: 50,
		//末尾加回车换行
		addCRLF: false,
		//HEX发送
		hexSend: false,
		//循环发送
		loopSend: false,
		//循环发送时间
		loopSendTime: 1000,
		//输入的发送内容
		sendContent: '',
	}
	//读取参数
	let options = localStorage.getItem('serialOptions')
	if (options) {
		let serialOptions = JSON.parse(options)
		set('serial-baud', serialOptions.baudRate)
		set('serial-data-bits', serialOptions.dataBits)
		set('serial-stop-bits', serialOptions.stopBits)
		set('serial-parity', serialOptions.parity)
		set('serial-buffer-size', serialOptions.bufferSize)
		set('serial-flow-control', serialOptions.flowControl)
	}
	options = localStorage.getItem('toolOptions')
	if (options) {
		toolOptions = JSON.parse(options)
		document.getElementById('serial-timer-out').value = toolOptions.timeOut
		document.getElementById('serial-log-type').value = toolOptions.logType
		document.getElementById('serial-auto-scroll').innerText = toolOptions.autoScroll ? '自动滚动' : '暂停滚动'
		document.getElementById('serial-add-crlf').checked = toolOptions.addCRLF
		document.getElementById('serial-hex-send').checked = toolOptions.hexSend
		document.getElementById('serial-loop-send').checked = toolOptions.loopSend
		document.getElementById('serial-loop-send-time').value = toolOptions.loopSendTime
		document.getElementById('serial-send-content').value = toolOptions.sendContent
		resetLoopSend();
	}

	//实时修改选项
	document.getElementById('serial-timer-out').addEventListener('change', (e) => {
		changeOption('timeOut', parseInt(e.target.value))
	})
	document.getElementById('serial-log-type').addEventListener('change', (e) => {
		changeOption('logType', e.target.value)
	})
	document.getElementById('serial-auto-scroll').addEventListener('click', function (e) {
		let autoScroll = this.innerText != '自动滚动'
		this.innerText = autoScroll ? '自动滚动' : '暂停滚动'
		changeOption('autoScroll', autoScroll)
	})
	document.getElementById('serial-send-content').addEventListener('change', function (e) {
		changeOption('sendContent', this.value)
	})
	document.getElementById('serial-add-crlf').addEventListener('change', function (e) {
		changeOption('addCRLF', this.checked)
	})
	document.getElementById('serial-hex-send').addEventListener('change', function (e) {
		changeOption('hexSend', this.checked)
	})
	document.getElementById('serial-loop-send').addEventListener('change', function (e) {
		changeOption('loopSend', this.checked)
		resetLoopSend()
	})
	document.getElementById('serial-loop-send-time').addEventListener('change', function (e) {
		changeOption('loopSendTime', parseInt(this.value))
		resetLoopSend()
	})
	//重制发送循环时钟
	function resetLoopSend() {
		clearInterval(serialloopSendTimer)
		if (toolOptions.loopSend) {
			serialloopSendTimer = setInterval(() => {
				send()
			}, toolOptions.loopSendTime)
		}
	}

	//清空
	document.getElementById('serial-clear').addEventListener('click', (e) => {
		serialLogs.innerHTML = ''
	})
	//复制
	document.getElementById('serial-copy').addEventListener('click', (e) => {
		let text = serialLogs.innerText
		if (text) {
			copyText(text)
		}
	})
	//保存
	document.getElementById('serial-save').addEventListener('click', (e) => {
		let text = serialLogs.innerText
		if (text) {
			saveText(text)
		}
	})
	//发送
	document.getElementById('serial-send').addEventListener('click', (e) => {
		send()
	})

	const serialToggle = document.getElementById('serial-open-or-close')

	const serialLogs = document.getElementById('serial-logs')

	document.getElementById('serial-select-port').addEventListener('click', async () => {
		// 客户端授权
		try {
			await navigator.serial.requestPort().then(async (port) => {
				//关闭旧的串口
				serialPort?.close()
				await serialPort?.forget()
				serialPort = port
			})
		} catch (e) {
			console.error('获取串口权限出错' + e.toString())
		}
	})
	//关闭串口
	async function closeSerial() {
		if (serialOpen) {
			serialOpen = false
			reader?.cancel()
			serialToggle.innerHTML = '打开串口'
			disabledOptions(false)
		}
	}
	//打开串口
	async function openSerial() {
		let SerialOptions = {
			baudRate: parseInt(get('serial-baud')),
			dataBits: parseInt(get('serial-data-bits')),
			stopBits: parseInt(get('serial-stop-bits')),
			parity: get('serial-parity'),
			bufferSize: parseInt(get('serial-buffer-size')),
			flowControl: get('serial-flow-control'),
		}

		serialPort
			.open(SerialOptions)
			.then(() => {
				serialToggle.innerHTML = '关闭串口'
				serialOpen = true
				serialClose = false
				disabledOptions(true)
				localStorage.setItem('serialOptions', JSON.stringify(SerialOptions))
				readData()
			})
			.catch((e) => {
				showMsg('打开串口失败:' + e.toString())
			})
	}
	//禁用或恢复串口选项
	function disabledOptions(disabled) {
		document.querySelectorAll('#serial-options .input-group input,#serial-options .input-group select').forEach((item) => {
			item.disabled = disabled
		})
	}
	serialToggle.addEventListener('click', async () => {
		if (!serialPort) {
			showMsg('请先选择串口')
			return
		}

		if (serialPort.writable && serialPort.readable) {
			closeSerial()
			serialClose = true
			return
		}

		openSerial()
	})
	set('serial-baud', 115200)
	set('serial-buffer-size', 1024)
	function get(id) {
		return document.getElementById(id).value
	}
	function set(id, value) {
		return (document.getElementById(id).value = value)
	}
	function changeOption(key, value) {
		toolOptions[key] = value
		localStorage.setItem('toolOptions', JSON.stringify(toolOptions))
	}
	async function send() {
		let content = document.getElementById('serial-send-content').value
		if (!content) {
			return
		}
		if (toolOptions.hexSend) {
			await sendHex(content)
		} else {
			await sendText(content)
		}
	}

	async function sendHex(hex) {
		const value = hex.replace(/\s+/g, '')
		if (/^[0-9A-Fa-f]+$/.test(value) && value.length % 2 === 0) {
			let data = []
			for (let i = 0; i < value.length; i = i + 2) {
				data.push(parseInt(value.substring(i, i + 2), 16))
			}
			await writeData(Uint8Array.from(data))
		}
	}
	async function sendText(text) {
		const encoder = new TextEncoder()
		writeData(encoder.encode(text))
	}
	async function writeData(data) {
		console.log(data)
		if (!serialPort.writable) {
			return
		}
		const writer = serialPort.writable.getWriter()
		if (toolOptions.addCRLF) {
			data = new Uint8Array([...data,0x0d, 0x0a])
		}
		await writer.write(data)
		writer.releaseLock()
		addLog(data,false)
	}
	async function readData() {
		while (serialOpen && serialPort.readable) {
			reader = serialPort.readable.getReader()
			try {
				while (true) {
					const { value, done } = await reader.read()
					if (done) {
						break
					}
					dataReceived(value)
				}
			} catch (error) {
			} finally {
				reader.releaseLock()
			}
		}
		await serialPort.close()
	}
	navigator.serial.addEventListener('connect', (e) => {
		console.info('设备已连接')
		serialPort = e.target
		//未主动关闭连接的情况下,设备重插,自动重连
		if (!serialClose) {
			openSerial()
		}
	})
	navigator.serial.addEventListener('disconnect', (e) => {
		console.info('设备已断开')
		setTimeout(closeSerial, 500)
	})

	function dataReceived(data) {
		serialData.push(...data)
		if (toolOptions.timeOut == 0) {
			addLog(serialData, true)
			serialData = []
			return
		}
		//清除之前的时钟
		clearTimeout(serialTimer)
		serialTimer = setTimeout(() => {
			//超时发出
			addLog(serialData, true)
			serialData = []
		}, toolOptions.timeOut)
	}
	function addLog(data, isReceive = true) {
		let classname = 'text-primary'
		let form = '→'
		if (isReceive) {
			classname = 'text-success'
			form = '←'
		}
		newmsg = ''
		if (toolOptions.logType.includes('hex')) {
			let dataHex = []
			for (const d of data) {
				//转16进制并补0
				dataHex.push(('0' + d.toString(16).toLocaleUpperCase()).slice(-2))
			}
			if (toolOptions.logType.includes('&')) {
				newmsg += 'HEX:'
			}
			newmsg += dataHex.join(' ') + '<br/>'
		}
		if (toolOptions.logType.includes('ascii')) {
			let dataAscii = asciidecoder.decode(Uint8Array.from(data))
			if (toolOptions.logType.includes('&')) {
				newmsg += 'TXT:'
			}
			newmsg += dataAscii + '<br/>'
		}
		let time = toolOptions.showTime ? formatDate(new Date()) + '&nbsp;' : ''
		const template = '<div><span class="' + classname + '">' + time + form + '</span><br>' + newmsg + '</div>'
		let tempNode = document.createElement('div')
		tempNode.innerHTML = template
		serialLogs.append(tempNode)
		if (toolOptions.autoScroll) {
			serialLogs.scrollTop = serialLogs.scrollHeight - serialLogs.clientHeight
		}
	}

	function copyText(text) {
		let textarea = document.createElement('textarea')
		textarea.value = text
		textarea.readOnly = 'readonly'
		textarea.style.position = 'absolute'
		textarea.style.left = '-9999px'
		document.body.appendChild(textarea)
		textarea.select()
		textarea.setSelectionRange(0, textarea.value.length)
		document.execCommand('copy')
		document.body.removeChild(textarea)
		showMsg('已复制到剪贴板')
	}

	function saveText(text) {
		let blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
		saveAs(blob, 'serial.log')
	}
	function saveAs(blob, filename) {
		if (window.navigator.msSaveOrOpenBlob) {
			navigator.msSaveBlob(blob, filename)
		} else {
			let link = document.createElement('a')
			let body = document.querySelector('body	')
			link.href = window.URL.createObjectURL(blob)
			link.download = filename
			// fix Firefox
			link.style.display = 'none'
			body.appendChild(link)
			link.click()
			body.removeChild(link)
			window.URL.revokeObjectURL(link.href)
		}
	}
	const modalTip = new bootstrap.Modal('#model-tip')
	function showMsg(msg, title = 'Web Serial') {
		//alert(msg)
		document.getElementById('modal-title').innerHTML = title
		document.getElementById('modal-message').innerHTML = msg
		modalTip.show();
	}

	function formatDate(now) {
		const hour = now.getHours() < 10 ? '0' + now.getHours() : now.getHours()
		const minute = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()
		const second = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()
		const millisecond = ('00' + now.getMilliseconds()).slice(-3)
		return `${hour}:${minute}:${second}.${millisecond}`
	}

	document.querySelectorAll('.toggle-button').forEach((element) => {
		element.addEventListener('click', (e) => {
			e.currentTarget.parentElement.querySelector('.collapse').classList.toggle('show')
			e.currentTarget.querySelector('i').classList.toggle('bi-chevron-compact-right')
			e.currentTarget.querySelector('i').classList.toggle('bi-chevron-compact-left')
		})
	})
})()
