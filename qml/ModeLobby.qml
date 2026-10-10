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
    readonly property color panel: "#0e1218ee"
    readonly property color line: "#3a423866"

    Rectangle {
        anchors.fill: parent
        color: "#12161c"
        gradient: Gradient {
            GradientStop { position: 0; color: "#1a2230" }
            GradientStop { position: 0.55; color: "#12161c" }
            GradientStop { position: 1; color: "#2a2418" }
        }
    }

    // Soft ridge silhouette for atmosphere (not a card collage).
    Canvas {
        anchors.fill: parent
        opacity: 0.55
        onPaint: {
            var ctx = getContext("2d")
            var w = width, h = height
            ctx.clearRect(0, 0, w, h)
            var g = ctx.createLinearGradient(0, h * 0.35, 0, h)
            g.addColorStop(0, "#00000000")
            g.addColorStop(1, "#4a3f3288")
            ctx.fillStyle = g
            ctx.beginPath()
            ctx.moveTo(0, h)
            for (var x = 0; x <= w; x += 8) {
                var y = h * 0.62 + Math.sin(x * 0.01) * 18 + Math.sin(x * 0.028) * 10
                ctx.lineTo(x, y)
            }
            ctx.lineTo(w, h)
            ctx.closePath()
            ctx.fill()
        }
        Component.onCompleted: requestPaint()
        onWidthChanged: requestPaint()
        onHeightChanged: requestPaint()
    }

    ColumnLayout {
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.verticalCenter: parent.verticalCenter
        width: Math.min(parent.width - 48, 420)
        spacing: 14

        Text {
            Layout.fillWidth: true
            text: "Ridge Fire"
            color: ink
            font.family: "IBM Plex Serif"
            font.pixelSize: 42
            font.weight: Font.Medium
            horizontalAlignment: Text.AlignHCenter
            opacity: 0
            NumberAnimation on opacity { from: 0; to: 1; duration: 700; easing.type: Easing.OutCubic }
        }
        Text {
            Layout.fillWidth: true
            text: "Two tanks. One ridge. Online or across the desk."
            color: muted
            font.family: "IBM Plex Sans"
            font.pixelSize: 14
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
        }

        Item { Layout.preferredHeight: 8 }

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
                implicitHeight: 44
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
                    color: "#1a2028"
                    border.color: line
                    border.width: 1
                    radius: 2
                    implicitHeight: 44
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
                    implicitHeight: 44
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
                implicitHeight: 40
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
