let streams = [];
let videoElements = [];
let pcs = [];


let len = $('#len').val();

let uuids = $('#suuids').val()
uuids = uuids.substring(1, uuids.length - 1);
let suuids = uuids.split(" ");


// =============== Redirect to another CCTV ====================

setTimeout(function() {
    var url = window.location.href;
    var listUrl = url.split('/');
    var pt = parseInt(listUrl[listUrl.length - 1]);
    if (pt === (parseInt(len) - 1)) {
        window.location.href = '/stream/all/0';
    }else{
        window.location.href = '/stream/all/' + (pt + 1);
    }
}, 30000);

// ==============================================

let config = {
    iceServers: [{
        urls: ["stun:stun.l.google.com:19302"]
    }]
};

function createPeerConnection(index) {
    const pc = new RTCPeerConnection(config);
    pc.onnegotiationneeded = () => handleNegotiationNeededEvent(pc, index);

    pc.ontrack = function(event) {
        streams[index].addTrack(event.track);
        videoElements[index].srcObject = streams[index];
        log(event.streams.length + ' track is delivered to video element ' + (index + 1));
    }

    pc.oniceconnectionstatechange = e => log(pc.iceConnectionState);
    return pc;
}


// Inisialisasi streams dan video elements berdasarkan panjang suuids
for (let i = 0; i < suuids.length; i++) {
    streams.push(new MediaStream());
    videoElements.push(document.getElementById(`videoElem${i+1}`));
    pcs.push(createPeerConnection(i));
}


let log = msg => {
    document.getElementById('div').innerHTML += msg + '<br>';
}

async function handleNegotiationNeededEvent(pc, index) {
    let offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    getRemoteSdp(pc, suuids [index]);
}

$(document).ready(function() {
    suuids.forEach((suuid, index) => {
        $('#' + suuid).addClass('active');
        getCodecInfo(suuid, pcs[index]);
    });

});

function getCodecInfo(suuid, pc) {
    $.get("/stream/codec/" + suuid, function(data) {
        try {
        data = JSON.parse(data);
        } catch (e) {
        console.log(e);
        } finally {
        $.each(data,function(index,value){
            pc.addTransceiver(value.Type, {
            'direction': 'sendrecv'
            })
        })
        //send ping becouse PION not handle RTCSessionDescription.close()
        sendChannel = pc.createDataChannel('foo');
        sendChannel.onclose = () => console.log('sendChannel has closed');
        sendChannel.onopen = () => {
            console.log('sendChannel has opened');
            sendChannel.send('ping');
            setInterval(() => {
            sendChannel.send('ping');
            }, 1000)
        }
        sendChannel.onmessage = e => log(`Message from DataChannel '${sendChannel.label}' payload '${e.data}'`);
        }
    });
}

function getRemoteSdp(pc, suuid) {
    $.post("/stream/receiver/" + suuid, {
        suuid: suuid,
        data: btoa(pc.localDescription.sdp)
    }, function(data) {
        try {
            pc.setRemoteDescription(new RTCSessionDescription({
                type: 'answer',
                sdp: atob(data)
            }));
        } catch (e) {
            console.warn(e);
        }
    });
}
