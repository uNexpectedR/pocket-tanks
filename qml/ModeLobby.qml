import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Item {
    id: root
    property var net: null

    signal playLocal()
    signal hostOnline()
    signal joinOnline(string code)

    readonly property color ink: "#e8e2d6"
    readonly property color muted: "#9a9488"
    readonly property color accent: "#c48c48"
    readonly property color line: "#3a423866"

    property real drift: 0

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0; color: "#0a1018" }
            GradientStop { position: 0.45; color: "#152238" }
            GradientStop { position: 0.72; color: "#3a3428" }
            GradientStop { position: 1; color: "#5a4030" }
        }
    }

    // Soft sun glow — intentional motion #1 (slow breathe).
    Rectangle {
        id: sunGlow
        width: parent.width * 0.55
        height: width
        radius: width / 2
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.horizontalCenterOffset: parent.width * 0.22
        y: parent.height * 0.28 - height * 0.35
        color: "#f0c878"
        opacity: 0.12 + Math.sin(root.drift * 1.2) * 0.03
        scale: 1 + Math.sin(root.drift * 0.8) * 0.04
    }

    // Ridge silhouette with slow parallax drift — motion #2.
    Canvas {
        id: ridgeCanvas
        anchors.fill: parent
        opacity: 0.7
        onPaint: {
            var ctx = getContext("2d")
            var w = width, h = height
            var d = root.drift
            ctx.clearRect(0, 0, w, h)

            function ridge(base, freq, amp, fill, ox) {
                ctx.beginPath()
                ctx.moveTo(0, h)
                for (var x = 0; x <= w; x += 6) {
                    var y = base + Math.sin((x + ox) * freq) * amp
                        + Math.sin((x + ox) * freq * 2.4) * amp * 0.35
                    ctx.lineTo(x, y)
                }
                ctx.lineTo(w, h)
                ctx.closePath()
                ctx.fillStyle = fill
                ctx.fill()
            }

            ridge(h * 0.58, 0.012, 20, "#1a2430aa", d * 8)
            ridge(h * 0.64, 0.018, 16, "#2a2418cc", d * 18)

            var haze = ctx.createLinearGradient(0, h * 0.5, 0, h)
            haze.addColorStop(0, "#00000000")
            haze.addColorStop(0.4, "#f0c87822")
            haze.addColorStop(1, "#4a3f3288")
            ctx.fillStyle = haze
            ctx.fillRect(0, h * 0.5, w, h * 0.5)
        }
        Component.onCompleted: requestPaint()
        onWidthChanged: requestPaint()
        onHeightChanged: requestPaint()
    }

    Timer {
        interval: 40
        running: root.visible
        repeat: true
        onTriggered: {
            root.drift += 0.04
            ridgeCanvas.requestPaint()
        }
    }

    ColumnLayout {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.verticalCenter: parent.verticalCenter
        width: Math.min(parent.width - 48, 420)
        spacing: 14

        Text {
            id: brandTitle
            Layout.fillWidth: true
            text: "Ridge Fire"
            color: ink
            font.family: "IBM Plex Serif"
            font.pixelSize: 48
            font.weight: Font.Medium
            horizontalAlignment: Text.AlignHCenter
            opacity: 0
            scale: 0.96
            transformOrigin: Item.Center
            SequentialAnimation on opacity {
                running: true
                NumberAnimation { from: 0; to: 1; duration: 720; easing.type: Easing.OutCubic }
            }
            SequentialAnimation on scale {
                running: true
                NumberAnimation { from: 0.94; to: 1; duration: 820; easing.type: Easing.OutCubic }
            }
        }
        Text {
            Layout.fillWidth: true
            text: "Two tanks. One ridge. Online or across the desk."
            color: muted
            font.family: "IBM Plex Sans"
            font.pixelSize: 14
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            opacity: 0
            NumberAnimation on opacity { from: 0; to: 1; duration: 900; easing.type: Easing.OutCubic }
        }

        Item { Layout.preferredHeight: 10 }

        Button {
            id: onlineHost
            Layout.fillWidth: true
            text: "Host online match"
            onClicked: root.hostOnline()
            contentItem: Text {
                text: onlineHost.text
                color: "#12161c"
                font.family: "IBM Plex Sans"
                font.pixelSize: 14
                font.bold: true
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            background: Rectangle {
                implicitHeight: 46
                color: onlineHost.down ? "#e2b57a" : accent
                radius: 2
            }
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 8
            TextField {
                id: joinField
                Layout.fillWidth: true
                placeholderText: "Room code"
                color: ink
                font.family: "IBM Plex Sans"
                font.pixelSize: 14
                font.capitalization: Font.AllUppercase
                background: Rectangle {
                    color: "#121820"
                    border.color: line
                    border.width: 1
                    radius: 2
                    implicitHeight: 46
                }
            }
            Button {
                id: joinBtn
                text: "Join"
                onClicked: root.joinOnline(joinField.text)
                contentItem: Text {
                    text: joinBtn.text
                    color: ink
                    font.family: "IBM Plex Sans"
                    font.pixelSize: 14
                    font.bold: true
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                background: Rectangle {
                    implicitWidth: 88
                    implicitHeight: 46
                    color: "#243040"
                    border.color: line
                    border.width: 1
                    radius: 2
                }
            }
        }

        Button {
            id: localBtn
            Layout.fillWidth: true
            text: "Local hotseat (same Mac)"
            onClicked: root.playLocal()
            contentItem: Text {
                text: localBtn.text
                color: ink
                font.family: "IBM Plex Sans"
                font.pixelSize: 13
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            background: Rectangle {
                implicitHeight: 42
                color: "transparent"
                border.color: line
                border.width: 1
                radius: 2
            }
        }

        Text {
            Layout.fillWidth: true
            Layout.topMargin: 6
            text: {
                if (!net)
                    return ""
                if (net.status === "error")
                    return net.detail
                if (net.role === "host" && net.roomCode)
                    return "Your code: " + net.roomCode + (net.detail ? "\n" + net.detail : "")
                return net.detail || (net.logosAvailable ? "Online via Logos delivery (logos.dev)." : "Preview mode — online needs Basecamp.")
            }
            color: net && net.status === "error" ? "#c45c48" : muted
            font.family: "IBM Plex Sans"
            font.pixelSize: 12
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
        }
    }
}
