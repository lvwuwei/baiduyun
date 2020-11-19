  let downloadUrl = `https://pan.baidu.com/api/download?clienttype=1`
            $.ajax({
                url: downloadUrl,
                async: false,
                method: 'POST',
                data: params,
                success: (response) => {
                    result = response
                }
            })

            return result
        }

        function getDownloadLinkWithRESTAPIBaidu(path) {
            return restAPIUrl + 'file?method=download&path=' + encodeURIComponent(path) + '&app_id=' + secretCode
        }

        function getDownloadById(path) {
            let paths = []
            $.each(ids, (index, element) => {
                paths.push(restAPIUrl + 'file?method=download&path=' + encodeURIComponent(path) + '&app_id=' + element)
            })
            return paths
        }

        function execDownload(link) {
            $('#helperdownloadiframe').attr('src', link)
        }

        function createIframe() {
            let $div = $('<div class="helper-hide" style="padding:0;margin:0;display:block"></div>')
            let $iframe = $('<iframe src="javascript:;" id="helperdownloadiframe" style="display:none"></iframe>')
            $div.append($iframe)
            $('body').append($div)

        }
    }

    //分享页面的下载助手
    function PanShareHelper() {
        let yunData, sign, timestamp, bdstoken, channel, clienttype, web, app_id, logid, encrypt, product, uk,
          primaryid, fid_list, extra, shareid
        let vcode
        let shareType, buttonTarget, dialog, vcodeDialog
        let selectFileList = []
        let panAPIUrl = location.protocol + "//" + location.host + "/api/"

        this.init = () => {
            yunData = unsafeWindow.yunData
            clog('初始化信息:', yunData)
            if (yunData === undefined) {
                clog('页面未正常加载，或者百度已经更新！')
                return
            }
            initVar()
            addButton()
            dialog = new Dialog({addCopy: false})
            vcodeDialog = new VCodeDialog(refreshVCode, confirmClick)
            createIframe()
            registerEventListener()
            clog('下载助手加载成功！当前版本：', version)
        }

        function isSuperVIP() {
            return yunData.ISSVIP === 1
        }

        function initVar() {
            shareType = getShareType()
            sign = yunData.SIGN
            timestamp = yunData.TIMESTAMP
            bdstoken = yunData.MYBDSTOKEN
            channel = 'chunlei'
            clienttype = 0
            web = 1
            app_id = secretCode
            logid = getLogID()
            encrypt = 0
            product = 'share'
            primaryid = yunData.SHARE_ID
            uk = yunData.SHARE_UK

            if (shareType == 'secret') {
                extra = getExtra()
            }
            if (!isSingleShare()) {
                shareid = yunData.SHARE_ID
            }
        }

        function getSelctedFile() {
            if (isSingleShare()) {
                return yunData.FILEINFO
            } else {
                return require("disk-share:widget/pageModule/list/listInit.js").getCheckedItems()
            }
        }

        //判断分享类型（public或者secret）
        function getShareType() {
            return yunData.SHARE_PUBLIC === 1 ? 'public' : 'secret'
        }

        //判断是单个文件分享还是文件夹或者多文件分享
        function isSingleShare() {
            return yunData.getContext === undefined ? true : false
        }

        //判断是否为自己的分享链接
        function isSelfShare() {
            return yunData.MYSELF == 1 ? true : false
        }

        function getExtra() {
            let seKey = decodeURIComponent(getCookie('BDCLND'))
            return '{' + '"sekey":"' + seKey + '"' + "}"
        }

        //获取当前目录
        function getPath() {
            let hash = location.hash
            let regx = new RegExp("path=([^&]*)(&|$)", 'i')
            let result = hash.match(regx)
            return decodeURIComponent(result[1])
        }

        //添加下载助手按钮
        function addButton() {
            if (isSingleShare()) {
                $('div.slide-show-right').css('width', '500px')
                $('div.frame-main').css('width', '96%')
                $('div.share-file-viewer').css('width', '740px').css('margin-left', 'auto').css('margin-right', 'auto')
            } else
                $('div.slide-show-right').css('width', '500px')
            let $dropdownbutton = $('<span class="g-dropdown-button"></span>')
            let $dropdownbutton_a = $('<a class="g-button" style="width: 114px;" data-button-id="b200" data-button-index="200" href="javascript:;"></a>')
            let $dropdownbutton_a_span = $('<span class="g-button-right"><em class="icon icon-download"></em><span class="text" style="width: 60px;">下载助手</span></span>')
            let $dropdownbutton_span = $('<span class="menu" style="width:auto;z-index:41"></span>')

            let $downloadButton = $('<a class="g-button-menu" href="javascript:;">直接下载</a>')
            let $linkButton = $('<a class="g-button-menu" href="javascript:;" data-type="down">显示链接</a>')
            let $aricLinkButton = $('<a class="g-button-menu" href="javascript:;">Aria下载</a>')
            let $aricRPCButton = $('<a class="g-button-menu" href="javascript:;" data-type="rpc">RPC下载</a>')
            let $versionButton = $('<a style="color: #F24C43;" class="g-button-menu" target="_blank" href="https://www.baiduyun.wiki/install.html">发现新版本</a>');

            $dropdownbutton_span.append($downloadButton).append($linkButton).append($aricLinkButton).append($aricRPCButton)
            $dropdownbutton_a.append($dropdownbutton_a_span)
            $dropdownbutton.append($dropdownbutton_a).append($dropdownbutton_span)

            if (getValue('up')) {
                $dropdownbutton_span.append($versionButton)
            }

            $dropdownbutton.hover(() => {
                $dropdownbutton.toggleClass('button-open')
            })
            $downloadButton.click(downloadButtonClick)
            $aricRPCButton.click(linkButtonClick)
            $linkButton.click(linkButtonClick)
            $aricLinkButton.click(ariclinkButtonClick)

            $('div.module-share-top-bar div.bar div.x-button-box').append($dropdownbutton)
        }

        function ariclinkButtonClick() {
            selectFileList = getSelctedFile()
            if (bdstoken === null) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.unlogin
                })
                return false
            }
            clog('选中文件列表：', selectFileList)
            if (selectFileList.length === 0) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.unselected
                })
                return false
            }
            if (selectFileList[0].isdir == 1) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.toobig
                })
                return false
            }

            buttonTarget = 'ariclink'
            getDownloadLink((downloadLink) => {
                if (downloadLink === undefined) return

                if (downloadLink.errno == -20) {
                    vcode = getVCode()
                    if (!vcode || vcode.errno !== 0) {
                        Toast.fire({
                            icon: 'error',
                            text: errorMsg.wrongcode
                        })
                        return false
                    }
                    vcodeDialog.open(vcode)
                } else if (downloadLink.errno == 112) {
                    Toast.fire({
                        icon: 'error',
                        text: errorMsg.timeout
                    })
                    return false
                } else if (downloadLink.errno === 0) {
                    let tip = '请先安装 <a  href="https://www.baiduyun.wiki/zh-cn/assistant.html">网盘万能助手</a> 请将链接复制到支持Aria的下载器中, 推荐使用 <a  href="http://pan.baiduyun.wiki/down">XDown</a>'
                    dialog.open({
                        title: '下载链接（仅显示文件链接）',
                        type: 'shareAriaLink',
                        list: downloadLink.list,
                        tip: tip,
                        showcopy: true
                    })
                } else {
                    Toast.fire({
                        icon: 'error',
                        text: errorMsg.fail
                    })
                }
            })
        }

        function createIframe() {
            let $div = $('<div class="helper-hide" style="padding:0;margin:0;display:block"></div>')
            let $iframe = $('<iframe src="javascript:;" id="helperdownloadiframe" style="display:none"></iframe>')
            $div.append($iframe)
            $('body').append($div)
        }

        function registerEventListener() {
            $(document).on('click', '.aria-rpc', (e) => {
                $(e.target).addClass('clicked')
                let link = e.target.dataset.link
                let filename = e.target.dataset.filename

                let url = ariaRPC.domain + ":" + ariaRPC.port + '/jsonrpc'
                let json_rpc = {
                    id: new Date().getTime(),
                    jsonrpc: '2.0',
                    method: 'aria2.addUri',
                    params: [
                        "token:" + ariaRPC.token,
                        [link],
                        {
                            dir: ariaRPC.dir,
                            out: filename,
                            header: ['User-Agent:' + userAgent, 'Cookie: BDUSS=' + getBDUSS()]

                        }
                    ]
                }
                GM_xmlhttpRequest({
                    method: "POST",
                    headers: {"User-Agent": userAgent},
                    url: url,
                    responseType: 'json',
                    timeout: 3000,
                    data: JSON.stringify(json_rpc),
                    onload: (response) => {
                        if (response.response.result) {
                            Toast.fire({
                                icon: 'success',
                                title: '任务已发送至RPC下载器'
                            })
                        } else {
                            Toast.fire({
                                icon: 'error',
                                title: response.response.message
                            })
                        }
                    },
                    ontimeout: () => {
                        Toast.fire({
                            icon: 'error',
                            title: '连接到RPC服务器超时，请检查RPC配置'
                        })
                    }
                })
            })
            $(document).on('click','.rpc-setting',(e)=>{
                rpcSetting()
            })
            $(document).on('click','.send-all',(e)=>{
                $('.aria-rpc').click()
                $('.dialog').hide()
                $('.dialog-shadow').hide()
            })
        }

        function downloadButtonClick() {
            selectFileList = getSelctedFile()
            if (bdstoken === null) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.unlogin
                })
                return false
            }
            clog('选中文件列表：', selectFileList)
            if (selectFileList.length === 0) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.unselected
                })
                return false
            }
            if (selectFileList.length > 1) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.morethan
                })
                return false
            }

            if (selectFileList[0].isdir == 1) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.dir
                })
                return false
            }
            buttonTarget = 'download'
            getDownloadLink((downloadLink) => {
                if (downloadLink === undefined) return

                if (downloadLink.errno == -20) {
                    vcode = getVCode()
                    if (vcode.errno !== 0) {
                        Toast.fire({
                            icon: 'error',
                            text: errorMsg.wrongcode
                        })
                        return
                    }
                    vcodeDialog.open(vcode)
                } else if (downloadLink.errno == 112) {
                    Toast.fire({
                        icon: 'error',
                        text: errorMsg.timeout
                    })
                } else if (downloadLink.errno === 0) {
                    let link = downloadLink.list[0].dlink
                    execDownload(link)
                } else {
                    Toast.fire({
                        icon: 'error',
                        text: errorMsg.fail
                    })
                }
            })
        }

        //获取验证码
        function getVCode() {
            let url = panAPIUrl + 'getvcode'
            let result
            logid = getLogID()
            let params = {
                prod: 'pan',
                t: Math.random(),
                bdstoken: bdstoken,
                channel: channel,
                clienttype: clienttype,
                web: web,
                app_id: app_id,
                logid: logid
            }
            $.ajax({
                url: url,
                method: 'GET',
                async: false,
                data: params,
                success: (response) => {
                    result = response
                }
            })
            return result
        }

        //刷新验证码
        function refreshVCode() {
            vcode = getVCode()
            $('#dialog-img').attr('src', vcode.img)
        }

        //验证码确认提交
        function confirmClick() {
            let val = $('#dialog-input').val()
            if (val.length === 0) {
                $('#dialog-err').text('请输入验证码')
                return
            } else if (val.length < 4) {
                $('#dialog-err').text('验证码输入错误，请重新输入')
                return
            }
            getDownloadLinkWithVCode(val, (result) => {
                if (result.errno == -20) {
                    vcodeDialog.close()
                    $('#dialog-err').text('验证码输入错误，请重新输入')
                    refreshVCode()
                    if (!vcode || vcode.errno !== 0) {
                        Toast.fire({
                            icon: 'error',
                            text: errorMsg.wrongcode
                        })
                        return
                    }
                    vcodeDialog.open()
                } else if (result.errno === 0) {
                    vcodeDialog.close()
                    if (buttonTarget == 'download') {
                        if (result.list.length > 1 || result.list[0].isdir == 1) {
                            Toast.fire({
                                icon: 'error',
                                text: errorMsg.morethan
                            })
                            return false
                        }
                        let link = result.list[0].dlink
                        execDownload(link)
                    }
                    if (buttonTarget == 'link') {
                        let tip = '点击链接直接下载，请先升级 <a href="https://www.baiduyun.wiki/zh-cn/assistant.html">[网盘万能助手]</a> 至 <b>v2.3.1</b>（出现403请尝试其他下载方法）'
                        dialog.open({
                            title: '下载链接（仅显示文件链接）',
                            type: 'shareLink',
                            list: result.list,
                            tip: tip,
                            showcopy: false
                        })
                    }
                    if (buttonTarget == 'ariclink') {
                        let tip = '请先安装 <a  href="https://www.baiduyun.wiki/zh-cn/assistant.html">网盘万能助手</a> 请将链接复制到支持Aria的下载器中, 推荐使用 <a  href="http://pan.baiduyun.wiki/down">XDown</a>'
                        dialog.open({
                            title: '下载链接（仅显示文件链接）',
                            type: 'shareAriaLink',
                            list: result.list,
                            tip: tip,
                            showcopy: false
                        })
                    }
                } else {
                    Toast.fire({
                        icon: 'error',
                        text: errorMsg.fail
                    })
                }
            })
        }

        //生成下载用的fid_list参数
        function getFidList() {
            let fidlist = []
            $.each(selectFileList, (index, element) => {
                fidlist.push(element.fs_id)
            })
            return '[' + fidlist + ']'
        }

        function linkButtonClick(e) {
            selectFileList = getSelctedFile()
            if (bdstoken === null) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.unlogin
                })
                return false
            }
            clog('选中文件列表：', selectFileList)
            if (selectFileList.length === 0) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.unselected
                })
                return false
            }
            if (selectFileList[0].isdir == 1) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.dir
                })
                return false
            }

            buttonTarget = 'link'
            getDownloadLink((downloadLink) => {
                if (downloadLink === undefined) return

                if (downloadLink.errno == -20) {
                    vcode = getVCode()
                    if (!vcode || vcode.errno !== 0) {
                        Toast.fire({
                            icon: 'error',
                            text: errorMsg.wrongcode
                        })
                        return false
                    }
                    vcodeDialog.open(vcode)
                } else if (downloadLink.errno == 112) {
                    Toast.fire({
                        icon: 'error',
                        text: errorMsg.timeout
                    })
                    return false
                } else if (downloadLink.errno === 0) {
                    if (e.target.dataset.type === 'rpc') {
                        let tip = '点击按钮发送链接至Aria下载器中 <a href="https://www.baiduyun.wiki/zh-cn/rpc.html">详细说明</a>，需配合最新版 <a href="https://www.baiduyun.wiki/zh-cn/assistant.html">[网盘万能助手]</a>，支持本地和远程下载'
                        dialog.open({
                            title: 'Aria RPC',
                            type: 'rpcLink',
                            list: downloadLink.list,
                            tip: tip,
                            showcopy: false,
                            showrpc: true
                        })
                    } else {
                        let tip = '点击链接直接下载，请先升级 <a href="https://www.baiduyun.wiki/zh-cn/assistant.html">[网盘万能助手]</a> 至 <b>v2.3.1</b>（出现403请尝试其他下载方式）'
                        dialog.open({
                            title: '下载链接（仅显示文件链接）',
                            type: 'shareLink',
                            list: downloadLink.list,
                            tip: tip,
                            showcopy: true
                        })
                    }

                } else {
                    Toast.fire({
                        icon: 'error',
                        text: errorMsg.fail
                    })
                }
            })
        }

        //获取下载链接
        function getDownloadLink(cb) {
            if (bdstoken === null) {
                Toast.fire({
                    icon: 'error',
                    text: errorMsg.unlogin
                })
                return ''
            }
            let res
            if (isSingleShare) {
                fid_list = getFidList()
                logid = getLogID()

                let params = new FormData()
                params.append('encrypt', encrypt)
                params.append('product', product)
                params.append('uk', uk)
                params.append('primaryid', primaryid)
                params.append('fid_list', fid_list)

                if (shareType == 'secret') {
                    params.append('extra', extra)
                }

                GM_xmlhttpRequest({
                    method: "POST",
                    data: params,
                    url: `https://pan.baidu.com/api/sharedownload?sign=${sign}&timestamp=${timestamp}+&logid=${logid}&channel=chunlei&clienttype=12&web=1&app_id=250528`,
                    onload: function (res) {
                        cb(JSON.parse(res.response))
                    }
                })
            }
        }

        //有验证码输入时获取下载链接
        function getDownloadLinkWithVCode(vcodeInput, cb) {
            let res
            if (isSingleShare) {
                fid_list = getFidList()
                logid = getLogID()

                let params = new FormData()
                params.append('encrypt', encrypt)
                params.append('product', product)
                params.append('uk', uk)
                params.append('primaryid', primaryid)
                params.append('fid_list', fid_list)
                params.append('vcode_input', vcodeInput)
                params.append('vcode_str', vcode.vcode)

                if (shareType == 'secret') {
                    params.append('extra', extra)
                }

                GM_xmlhttpRequest({
                    method: "POST",
                    data: params,
                    url: `https://pan.baidu.com/api/sharedownload?sign=${sign}&timestamp=${timestamp}+&logid=${logid}&channel=chunlei&clienttype=12&web=1&app_id=250528`,
                    onload: function (res) {
                        cb(JSON.parse(res.response))
                    }
                })
            }
        }

        function execDownload(link) {
            clog('下载链接：' + link)
            if (link) {
                GM_xmlhttpRequest({
                    method: "POST",
                    headers: {
                        "User-Agent": userAgent
                    },
                    url: link,
                    onload: (res) => {
                        //cb(JSON.parse(res.response));
                    }
                })
            }
            //GM_openInTab(link, {active: false});
            //$('#helperdownloadiframe').attr('src', link);
        }
    }

    function PanPlugin() {
        clog('RPC：', ariaRPC)
        this.init = () => {
            main()
            addGMStyle()
            checkUpdate()
            if (getValue('SETTING_H')) createHelp()
            createMenu()
        }

        function loadPanhelper() {
            switch (detectPage()) {
                case 'disk':
                case 'oauth2.0':
                    let panHelper = new PanHelper()
                    panHelper.init()
                    return
                case 'share':
                case 's':
                    let panShareHelper = new PanShareHelper()
                    panShareHelper.init()
                    return
                default:
                    return
            }
        }

        function addGMStyle() {
            GM_addStyle(`
                .dialog .row {overflow: hidden;text-overflow: ellipsis;white-space: nowrap;}
                .dialog .row .ui-title {width: 150px;float: left;overflow: hidden;text-overflow: ellipsis;}
                .dialog .row .ui-link {margin-right: 20px;}
                .dialog-body {max-height: 450px;overflow-y: auto;padding: 0 20px;}
                .dialog-tip {padding: 0 20px;background-color: #fff;border-top: 1px solid #c4dbfe;color: #dc373c;}
                .tm-setting {display: flex;align-items: center;justify-content: space-between;padding-top: 20px;}
                .tm-checkbox {width: 16px;height: 16px;}
                #dialog-copy-button {width: 120px;margin: 5px 10px 10px;cursor: pointer;background: #cc3235;border: none;height: 30px;color: #fff;border-radius: 3px;}
                #dialog-send-button {width: 120px;margin: 5px 10px 10px;cursor: pointer;background: #cc3235;border: none;height: 30px;color: #fff;border-radius: 3px;}
                #dialog-rpc-button {width: 120px;margin: 5px 10px 10px;cursor: pointer;background: #4e97ff;border: none;height: 30px;color: #fff;border-radius: 3px;}
                .flex-center-between {display: flex;align-items: center;justify-content: space-between}
                .swal2-input {height:50px!important;margin:10px auto!important;}
                .aria-rpc { background: #09AAFF; border: 0; border-radius: 4px; color: #ffffff; cursor: pointer; font-size: 12px; padding: 2px 15px;outline:none; }
                .aria-rpc.clicked { background: #808080; }
            `)
        }

        function checkUpdate() {
            setValue('up',0)
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://api.baiduyun.wiki/update?ver=${version}`,
                responseType: 'json',
                onload: function (r) {
                    let res = r.response
                    setValue('lastest_version', res.version)
                    userAgent = res.ua
                    ids = res.ids
                    if (res.vcode === 200 && compareVersion(res.version,version)) {
                        setValue('up',1)
                    }
                    if (res.scode != getValue('scode')) {
                        let dom = $('<div><img style="width: 250px;margin-bottom: 10px;" src="https://img.tool22.com/image/5f365d403c89f.jpg"><input class="swal2-input" id="scode" type="text" placeholder="请输入暗号，可扫描上方二维码免费获取!"></div>')
                        Swal.fire({
                            title: "初次使用请输入暗号",
                            html: dom[0],
                            allowOutsideClick: false,
                            confirmButtonText: '确定'
                        }).then((result) => {
                            if (res.scode == $('#scode').val()) {
                                setValue('scode', res.scode)
                                setValue('init', 1)
                                Toast.fire({
                                    icon: 'success',
                                    text: '暗号正确，正在初始化中。。。',
                                }).then(() => {
                                    history.go(0)
                                })
                            } else {
                                setValue('init', 0)
                                Swal.fire({
                                    title: "🔺🔺🔺",
                                    text: '暗号不正确，请通过微信扫码免费获取',
                                    imageUrl: 'https://img.tool22.com/image/5f365d403c89f.jpg',
                                })
                            }
                        })
                    } else {
                        loadPanhelper()
                    }
                }
            })
        }

        function compareVersion(a,b) {
            return (a.replace(/\./g,'') - b.replace(/\./g,'')) > 0
        }

        function createHelp() {
            setTimeout(() => {
                let topbar = $('.' + classMap['header'])
                let toptemp = $('<span class="cMEMEF" node-type="help-author" style="opacity: .5" ><a href="https://www.baiduyun.wiki/" target="_blank">教程</a><i class="find-light-icon" style="display: inline;background-color: #009fe8;"></i></span>')
                topbar.append(toptemp)
            }, 5000)
        }

        function createMenu() {
            GM_registerMenuCommand('设置', () => {
                if (getValue('SETTING_H') === undefined) {
                    setValue('SETTING_H', true)
                }

                if (getValue('SETTING_B') === undefined) {
                    setValue('SETTING_B', false)
                }

                let dom = ''
                if (getValue('SETTING_B')) {
                    dom += '<label class="tm-setting">开启备用链接<input type="checkbox" id="S-B" checked class="tm-checkbox"></label>'
                } else {
                    dom += '<label class="tm-setting">开启备用链接<input type="checkbox" id="S-B" class="tm-checkbox"></label>'
                }
                if (getValue('SETTING_H')) {
                    dom += '<label class="tm-setting">开启教程<input type="checkbox" id="S-H" checked class="tm-checkbox"></label>'
                } else {
                    dom += '<label class="tm-setting">开启教程<input type="checkbox" id="S-H" class="tm-checkbox"></label>'
                }
                dom = '<div>' + dom + '</div>'
                let $dom = $(dom)
                Swal.fire({
                    title: '脚本配置',
                    html: $dom[0],
                    confirmButtonText: '保存'
                }).then((result) => {
                    history.go(0)
                })
            })
            $(document).on('change', '#S-B', () => {
                setValue('SETTING_B', $(this)[0].checked)
            })
            $(document).on('change', '#S-H', () => {
                setValue('SETTING_H', $(this)[0].checked)
            })
        }

        function main() {
            setValue('current_version', version)

            //解决https无法加载http资源的问题
            let oMeta = document.createElement('meta')
            oMeta.httpEquiv = 'Content-Security-Policy'
            oMeta.content = 'upgrade-insecure-requests'
            document.getElementsByTagName('head')[0].appendChild(oMeta)

            $(document).on('contextmenu', '.aria-link', (e) => {
                e.preventDefault()
                return false
            })

            $(document).on('mousedown', '.aria-link', (e) => {
                e.preventDefault()
                let link = decodeURIComponent($(this).text())
                GM_setClipboard(link, 'text')
                Toast.fire({
                    icon: 'success',
                    text: '已将链接复制到剪贴板！'
                })
                return false
            })

            $(document).on('click', '.share-download', (e) => {
                e.preventDefault()
                if (e.target.innerText) {
                    GM_xmlhttpRequest({
                        method: "POST",
                        headers: {"User-Agent": userAgent},
                        url: e.target.innerText,
                        onload: (res) => {
                            //GM_openInTab(res.finalUrl, {active: false});
                        }
                    })
                }
            })

            $(document).on('click', '.pcs-link', (e) => {
                let link = e.target.dataset.link
                let filename = e.target.dataset.filename
                if (link) {
                    GM_xmlhttpRequest({
                        method: "HEAD",
                        headers: {"User-Agent": userAgent},
                        url: link,
                        onload: (res) => {
                            let final = res.finalUrl.replace('https', "http")
                            GM_download({
                                url: final,
                                headers: {"User-Agent": userAgent},
                                name: filename,
                                saveAs: true,
                            })
                        }
                    })
                }
            })
        }
    }

    $(() => {
        //阻止在其他网站运行
        if (hostname.match(/(pan|yun).baidu.com/i)) {
            let plugin = new PanPlugin()
            plugin.init()
        }
    })
})()
