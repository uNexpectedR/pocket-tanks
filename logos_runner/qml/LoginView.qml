import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "."

Item {
    id: root

    property string initialName: ""
    property string errorText: ""

    signal submitted(string name)
    signal showBoard()

    ColumnLayout {
        anchors.centerIn: parent
        width: Math.min(parent.width - 48, 360)
        spacing: 14

        Text {
            Layout.fillWidth: true
            text: "LOGOS RUNNER"
            color: Theme.teal
            font.pixelSize: 28
            font.bold: true
            font.letterSpacing: 2
            horizontalAlignment: Text.AlignHCenter
        }

        Text {
            Layout.fillWidth: true
            text: "Neon strip endless runner for Logos Basecamp."
            color: Theme.mute
            font.pixelSize: 13
            wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
        }

        TextField {
            id: nameField
            Layout.fillWidth: true
            text: root.initialName
            placeholderText: "Callsign (2–16: A–Z 0–9 _ - .)"
            color: Theme.ink
            placeholderTextColor: Theme.mute
            maximumLength: 16
            selectByMouse: true
            background: Rectangle {
                color: Theme.bg1
                border.color: nameField.activeFocus ? Theme.teal : "#243142"
                radius: Theme.radius
            }
            Keys.onReturnPressed: root.trySubmit()
            Keys.onEnterPressed: root.trySubmit()
        }

        Text {
            Layout.fillWidth: true
            visible: root.errorText.length > 0
            text: root.errorText
            color: Theme.danger
            font.pixelSize: 12
            wrapMode: Text.WordWrap
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 10

            Button {
                Layout.fillWidth: true
                text: "Enter strip"
                onClicked: root.trySubmit()
                contentItem: Text {
                    text: parent.text
                    color: Theme.bg0
                    font.bold: true
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                background: Rectangle {
                    color: Theme.teal
                    radius: Theme.radius
                }
            }

            Button {
                text: "Board"
                onClicked: root.showBoard()
                contentItem: Text {
                    text: parent.text
                    color: Theme.ink
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                background: Rectangle {
                    color: "transparent"
                    border.color: "#334155"
                    radius: Theme.radius
                }
            }
        }
    }

    function trySubmit() {
        submitted(nameField.text)
    }

    function focusName() {
        nameField.forceActiveFocus()
    }
}
