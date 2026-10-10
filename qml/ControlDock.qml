import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

Item {
    id: root
    property var battlefield: null
    property int angle: 45
    property int power: 50
    property string tankName: "—"
    property string weaponName: "HE Shell"
    property bool canAim: true
    property bool gameOver: false

    readonly property color ink: "#e8e2d6"
    readonly property color muted: "#9a9488"
    readonly property color accent: "#c48c48"
    readonly property color track: "#2a323c"

    function syncFromMatch() {
        if (!battlefield || !battlefield.match)
            return
        var m = battlefield.match
        gameOver = m.phase === "over"
        canAim = m.phase === "aim"
        var t = m.tanks[m.turn]
        if (!t)
            return
        tankName = t.name
        angle = Math.round(t.angle)
        power = Math.round(t.power)
        weaponName = battlefield.weaponName
    }

    Rectangle {
        anchors.fill: parent
        color: "#0e1218d9"
        border.color: "#3a423855"
        border.width: 1
    }

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 20
        anchors.rightMargin: 20
        anchors.topMargin: 12
        anchors.bottomMargin: 12
        spacing: 22

        ColumnLayout {
            Layout.preferredWidth: 140
            spacing: 2
            Text {
                text: gameOver ? "Match over" : (tankName + " · aim")
                color: ink
                font.family: "IBM Plex Serif"
                font.pixelSize: 16
            }
            Text {
                text: weaponName
                color: muted
                font.family: "IBM Plex Sans"
                font.pixelSize: 12
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 4
            Text {
                text: "Angle  " + angle + "°"
                color: muted
                font.family: "IBM Plex Sans"
                font.pixelSize: 11
            }
            Slider {
                id: angleSlider
                Layout.fillWidth: true
                from: 5
                to: 80
                stepSize: 1
                value: angle
                enabled: canAim && !gameOver
                onMoved: {
                    angle = Math.round(value)
                    if (battlefield)
                        battlefield.setAngle(angle)
                }
                background: Rectangle {
                    x: angleSlider.leftPadding
                    y: angleSlider.topPadding + angleSlider.availableHeight / 2 - 1
                    width: angleSlider.availableWidth
                    height: 2
                    color: track
                    Rectangle {
                        width: angleSlider.visualPosition * parent.width
                        height: parent.height
                        color: accent
                    }
                }
                handle: Rectangle {
                    x: angleSlider.leftPadding + angleSlider.visualPosition * (angleSlider.availableWidth - width)
                    y: angleSlider.topPadding + angleSlider.availableHeight / 2 - height / 2
                    width: 14
                    height: 14
                    radius: 2
                    color: ink
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            spacing: 4
            Text {
                text: "Power  " + power
                color: muted
                font.family: "IBM Plex Sans"
                font.pixelSize: 11
            }
            Slider {
                id: powerSlider
                Layout.fillWidth: true
                from: 10
                to: 100
                stepSize: 1
                value: power
                enabled: canAim && !gameOver
                onMoved: {
                    power = Math.round(value)
                    if (battlefield)
                        battlefield.setPower(power)
                }
                background: Rectangle {
                    x: powerSlider.leftPadding
                    y: powerSlider.topPadding + powerSlider.availableHeight / 2 - 1
                    width: powerSlider.availableWidth
                    height: 2
                    color: track
                    Rectangle {
                        width: powerSlider.visualPosition * parent.width
                        height: parent.height
                        color: accent
                    }
                }
                handle: Rectangle {
                    x: powerSlider.leftPadding + powerSlider.visualPosition * (powerSlider.availableWidth - width)
                    y: powerSlider.topPadding + powerSlider.availableHeight / 2 - height / 2
                    width: 14
                    height: 14
                    radius: 2
                    color: ink
                }
            }
        }

        RowLayout {
            spacing: 10
            Button {
                id: fireBtn
                text: gameOver ? "Again" : "Fire"
                enabled: gameOver || canAim
                onClicked: {
                    if (gameOver) {
                        if (battlefield)
                            battlefield.restart()
                    } else if (battlefield) {
                        battlefield.fire()
                    }
                    root.syncFromMatch()
                }
                contentItem: Text {
                    text: fireBtn.text
                    color: "#12161c"
                    font.family: "IBM Plex Sans"
                    font.pixelSize: 13
                    font.bold: true
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                background: Rectangle {
                    implicitWidth: 96
                    implicitHeight: 36
                    color: fireBtn.down ? "#e2b57a" : accent
                    radius: 2
                    opacity: fireBtn.enabled ? 1 : 0.4
                }
            }
        }
    }

    Timer {
        interval: 100
        running: true
        repeat: true
        onTriggered: {
            // Keep sliders in sync when keyboard nudges aim.
            if (!angleSlider.pressed && !powerSlider.pressed)
                root.syncFromMatch()
        }
    }
}
