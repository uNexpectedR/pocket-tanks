import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "."

Item {
    id: root
    width: 960
    height: 600

    property string screen: "lobby" // lobby | play

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0; color: "#0a1018" }
            GradientStop { position: 1; color: "#12161c" }
        }
    }

    NetBridge {
        id: net
        onMatchReady: function (seed) {
            field.localSeat = net.localSeat
            field.restart(seed)
            root.screen = "play"
        }
        onRemoteFire: function (msg) {
            field.applyRemoteFire(msg)
        }
    }

    ModeLobby {
        id: lobby
        anchors.fill: parent
        visible: root.screen === "lobby"
        net: net
        onPlayLocal: {
            net.startLocal()
            field.localSeat = -1
            field.restart()
            root.screen = "play"
        }
        onHostOnline: net.hostGame()
        onJoinOnline: function (code) { net.joinGame(code) }
    }

    Item {
        id: playRoot
        anchors.fill: parent
        visible: root.screen === "play"
        opacity: visible ? 1 : 0
        focus: visible
        activeFocusOnTab: true
        Behavior on opacity { NumberAnimation { duration: 350; easing.type: Easing.OutCubic } }

        // Keys on the play surface — avoid a full-screen FocusScope overlay.
        Keys.onPressed: function (event) {
            if (!field.match)
                return
            if (field.match.phase === "over" && (event.key === Qt.Key_Return || event.key === Qt.Key_Space)) {
                root.screen = "lobby"
                event.accepted = true
                return
            }
            if (field.match.phase !== "aim")
                return
            if (event.key === Qt.Key_Left) {
                field.nudgeAngle(event.modifiers & Qt.ShiftModifier ? -5 : -1)
                event.accepted = true
            } else if (event.key === Qt.Key_Right) {
                field.nudgeAngle(event.modifiers & Qt.ShiftModifier ? 5 : 1)
                event.accepted = true
            } else if (event.key === Qt.Key_Down) {
                field.nudgePower(event.modifiers & Qt.ShiftModifier ? -5 : -1)
                event.accepted = true
            } else if (event.key === Qt.Key_Up) {
                field.nudgePower(event.modifiers & Qt.ShiftModifier ? 5 : 1)
                event.accepted = true
            } else if (event.key === Qt.Key_Tab || event.key === Qt.Key_Q) {
                field.cycleWeapon(event.modifiers & Qt.ShiftModifier ? -1 : 1)
                event.accepted = true
            } else if (event.key === Qt.Key_Space || event.key === Qt.Key_Return) {
                field.fire()
                event.accepted = true
            } else if (event.key === Qt.Key_Escape) {
                root.screen = "lobby"
                event.accepted = true
            } else if (event.key === Qt.Key_R && net.role === "local") {
                field.restart()
                event.accepted = true
            }
        }

        Text {
            id: brand
            anchors.left: parent.left
            anchors.top: parent.top
            anchors.margins: 14
            z: 3
            text: "Ridge Fire"
            color: "#e8e2d6"
            font.family: "IBM Plex Serif"
            font.pixelSize: 24
            font.weight: Font.Medium
            style: Text.Raised
            styleColor: "#00000066"
        }

        Text {
            anchors.left: brand.left
            anchors.top: brand.bottom
            z: 3
            text: net.role === "local"
                  ? "Hotseat"
                  : (net.role === "host" ? "Host · " + net.roomCode : (net.role === "guest" ? "Guest · " + net.roomCode : ""))
            color: "#9a9488"
            font.family: "IBM Plex Sans"
            font.pixelSize: 11
        }

        Battlefield {
            id: field
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            anchors.bottom: dock.top
            onFireIntent: function (intent) {
                net.broadcastFire(intent)
            }
        }

        ControlDock {
            id: dock
            z: 5
            battlefield: field
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.bottom: parent.bottom
            height: 120
            onMenuRequested: {
                root.screen = "lobby"
                field.match = null
            }
        }

        onVisibleChanged: {
            if (visible)
                forceActiveFocus()
        }
    }
}
