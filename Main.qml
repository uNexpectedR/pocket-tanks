import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "qml"

Item {
    id: root
    // Host (Basecamp / standalone) sizes the plugin surface.
    width: 960
    height: 600

    Rectangle {
        anchors.fill: parent
        color: "#12161c"
    }

    // Brand mark — hero-level, not a nav crumb.
    Text {
        id: brand
        anchors.left: parent.left
        anchors.top: parent.top
        anchors.margins: 18
        z: 2
        text: "Ridge Fire"
        color: "#e8e2d6"
        font.family: "IBM Plex Serif"
        font.pixelSize: 28
        font.weight: Font.Medium
        opacity: 0
        NumberAnimation on opacity {
            from: 0; to: 1; duration: 700; easing.type: Easing.OutCubic
            running: true
        }
    }

    Text {
        anchors.left: brand.left
        anchors.top: brand.bottom
        anchors.topMargin: 2
        z: 2
        text: "Artillery along a living ridge"
        color: "#9a9488"
        font.family: "IBM Plex Sans"
        font.pixelSize: 12
        opacity: brand.opacity * 0.9
    }

    Battlefield {
        id: field
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.top: parent.top
        anchors.bottom: dock.top
    }

    ControlDock {
        id: dock
        battlefield: field
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        height: 84
    }

    FocusScope {
        anchors.fill: parent
        focus: true
        Keys.onPressed: function (event) {
            if (!field.match)
                return
            if (field.match.phase === "over" && (event.key === Qt.Key_Return || event.key === Qt.Key_Space)) {
                field.restart()
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
            } else if (event.key === Qt.Key_Space || event.key === Qt.Key_Return) {
                field.fire()
                event.accepted = true
            } else if (event.key === Qt.Key_R) {
                field.restart()
                event.accepted = true
            }
        }
    }

    // Subtle entrance for the battlefield plane.
    PropertyAnimation {
        target: field
        property: "opacity"
        from: 0
        to: 1
        duration: 900
        easing.type: Easing.OutCubic
        running: true
    }
}
