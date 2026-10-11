import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import "."

Item {
    id: root

    property var board: []
    property string callsign: ""
    property string syncStatus: ""
    property string syncDetail: ""

    signal back()
    signal syncRequested()

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: Theme.pad
        spacing: 12

        RowLayout {
            Layout.fillWidth: true
            Text {
                text: "High scores"
                color: Theme.ink
                font.pixelSize: 22
                font.bold: true
                Layout.fillWidth: true
            }
            Button {
                text: "Sync"
                onClicked: root.syncRequested()
                contentItem: Text {
                    text: parent.text
                    color: Theme.teal
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                background: Rectangle {
                    color: "transparent"
                    border.color: Theme.teal
                    radius: Theme.radius
                }
            }
            Button {
                text: "Back"
                onClicked: root.back()
                contentItem: Text {
                    text: parent.text
                    color: Theme.ink
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
                background: Rectangle {
                    color: "#1a2332"
                    radius: Theme.radius
                }
            }
        }

        Text {
            Layout.fillWidth: true
            text: syncStatus + (syncDetail ? " — " + syncDetail : "")
            color: Theme.mute
            font.pixelSize: 12
            wrapMode: Text.WordWrap
        }

        ListView {
            Layout.fillWidth: true
            Layout.fillHeight: true
            clip: true
            model: root.board
            spacing: 6
            delegate: Rectangle {
                width: ListView.view.width
                height: 40
                radius: Theme.radius
                color: modelData.name === root.callsign ? "#15202e" : "transparent"
                border.color: modelData.name === root.callsign ? Theme.teal : "#1e293b"

                RowLayout {
                    anchors.fill: parent
                    anchors.leftMargin: 12
                    anchors.rightMargin: 12
                    Text {
                        text: (index + 1) + "."
                        color: Theme.mute
                        font.pixelSize: 13
                        Layout.preferredWidth: 28
                    }
                    Text {
                        text: modelData.name
                        color: Theme.ink
                        font.pixelSize: 14
                        font.bold: modelData.name === root.callsign
                        Layout.fillWidth: true
                        elide: Text.ElideRight
                    }
                    Text {
                        text: String(modelData.score)
                        color: Theme.amber
                        font.pixelSize: 14
                        font.bold: true
                    }
                }
            }

            Text {
                anchors.centerIn: parent
                visible: root.board.length === 0
                text: "No scores yet. Run the strip."
                color: Theme.mute
            }
        }
    }
}
