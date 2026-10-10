import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "js/Weapons.js" as Weapons

Item {
    id: root
    property var battlefield: null
    property int angle: 45
    property int power: 50
    property string tankName: "—"
    property string weaponName: "HE Shell"
    property string weaponId: "he"
    property bool canAim: true
    property bool gameOver: false
    property string waitHint: ""

    readonly property color ink: "#e8e2d6"
    readonly property color muted: "#9a9488"
    readonly property color accent: "#c48c48"
    readonly property color track: "#2a323c"

    signal menuRequested()

    function syncFromMatch() {
        if (!battlefield || !battlefield.match)
            return
        var m = battlefield.match
        gameOver = m.phase === "over"
        canAim = battlefield.canControl()
        waitHint = ""
        if (!gameOver && m.phase === "aim" && battlefield.localSeat >= 0 && m.turn !== battlefield.localSeat)
            waitHint = "Opponent aiming…"
        var t = m.tanks[m.turn]
        if (!t)
            return
        if (gameOver)
            tankName = m.message
        else if (m.phase === "flight")
            tankName = t.name + " · firing"
        else if (m.phase === "resolve")
            tankName = t.name + " · impact"
        else
            tankName = t.name + " · aim"
        angle = Math.round(t.angle)
        power = Math.round(t.power)
        weaponName = battlefield.weaponName
        weaponId = m.weaponId
    }

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0; color: "#0a0e14ee" }
            GradientStop { position: 1; color: "#121820f0" }
        }
        border.color: "#3a423866"
        border.width: 1

        Rectangle {
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            height: 1
            color: "#e2b57a33"
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 16
        anchors.rightMargin: 16
        anchors.topMargin: 10
        anchors.bottomMargin: 10
        spacing: 14

        ColumnLayout {
            Layout.preferredWidth: 150
            spacing: 2
            Text {
                text: gameOver ? "Match over" : tankName
                color: ink
                font.family: "IBM Plex Serif"
                font.pixelSize: 15
            }
            Text {
                text: waitHint || weaponName
                color: waitHint ? accent : muted
                font.family: "IBM Plex Sans"
                font.pixelSize: 12
            }
        }

        ColumnLayout {
            Layout.preferredWidth: 130
            spacing: 4
            Text {
                text: "Weapon"
                color: muted
                font.family: "IBM Plex Sans"
                font.pixelSize: 11
            }
            ComboBox {
                id: weaponBox
                Layout.fillWidth: true
                enabled: canAim && !gameOver
                model: ["HE Shell", "Dirt Mover", "Ridge Roller", "Sky Burster"]
                property var weaponIds: ["he", "dirt", "roller", "burster"]
                onActivated: {
                    if (battlefield && currentIndex >= 0)
                        battlefield.setWeapon(weaponIds[currentIndex])
                }
                contentItem: Text {
                    text: weaponBox.displayText
                    color: ink
                    font.family: "IBM Plex Sans"
                    font.pixelSize: 12
                    verticalAlignment: Text.AlignVCenter
                    leftPadding: 8
                }
                background: Rectangle {
                    implicitHeight: 28
                    color: track
                    border.color: "#3a423866"
                    radius: 2
                }
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
            spacing: 8
            Button {
                id: fireBtn
                text: gameOver ? "Again" : "Fire"
                enabled: gameOver || canAim
                onClicked: {
                    if (gameOver) {
                        root.menuRequested()
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
                    implicitWidth: 88
                    implicitHeight: 36
                    color: fireBtn.down ? "#e2b57a" : accent
                    radius: 2
                    opacity: fireBtn.enabled ? 1 : 0.4
                }
            }
        }
    }

    function syncWeaponBox() {
        var ids = weaponBox.weaponIds
        for (var i = 0; i < ids.length; i++) {
            if (ids[i] === root.weaponId && weaponBox.currentIndex !== i) {
                weaponBox.currentIndex = i
                return
            }
        }
    }

    Timer {
        interval: 100
        running: true
        repeat: true
        onTriggered: {
            if (angleSlider.pressed || powerSlider.pressed)
                return
            root.syncFromMatch()
            root.syncWeaponBox()
        }
    }
}
