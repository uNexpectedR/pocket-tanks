import QtQuick 2.15
import QtQuick.Controls 2.15
import "."

Item {
    id: root
    width: 960
    height: 600

    property string screen: "login" // login | run | board | over
    property int lastScore: 0

    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0; color: Theme.bg0 }
            GradientStop { position: 1; color: Theme.bg1 }
        }
    }

    ScoreBridge { id: scores }

    LoginView {
        id: login
        anchors.fill: parent
        visible: root.screen === "login"
        initialName: scores.callsign
        onSubmitted: function (name) {
            if (!scores.setCallsign(name)) {
                errorText = "Use 2–16 chars: letters, numbers, _ - ."
                return
            }
            errorText = ""
            root.screen = "run"
        }
        onShowBoard: root.screen = "board"
        Component.onCompleted: focusName()
    }

    Loader {
        id: runLoader
        anchors.fill: parent
        active: root.screen === "run"
        sourceComponent: RunView {
            callsign: scores.callsign
            onFinished: function (score) {
                root.lastScore = score
                scores.submitScore(score)
                root.screen = "over"
            }
            onQuitToMenu: root.screen = "login"
        }
    }

    BoardView {
        anchors.fill: parent
        visible: root.screen === "board"
        board: scores.board
        callsign: scores.callsign
        syncStatus: scores.syncStatus
        syncDetail: scores.syncDetail
        onBack: root.screen = "login"
        onSyncRequested: scores.ensureSync()
    }

    // Game-over — single purpose, no clutter
    Item {
        anchors.fill: parent
        visible: root.screen === "over"

        Column {
            anchors.centerIn: parent
            spacing: 12
            width: Math.min(parent.width - 48, 320)

            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: "RUN OVER"
                color: Theme.pink
                font.pixelSize: 26
                font.bold: true
                font.letterSpacing: 2
            }
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: scores.callsign + " — " + root.lastScore
                color: Theme.ink
                font.pixelSize: 18
            }
            Row {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 10
                Button {
                    text: "Again"
                    onClicked: root.screen = "run"
                    contentItem: Text {
                        text: parent.text
                        color: Theme.bg0
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Rectangle { color: Theme.teal; radius: Theme.radius }
                }
                Button {
                    text: "Board"
                    onClicked: root.screen = "board"
                    contentItem: Text {
                        text: parent.text
                        color: Theme.ink
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Rectangle { color: "#1a2332"; radius: Theme.radius }
                }
                Button {
                    text: "Menu"
                    onClicked: root.screen = "login"
                    contentItem: Text {
                        text: parent.text
                        color: Theme.mute
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Rectangle { color: "transparent"; border.color: "#334155"; radius: Theme.radius }
                }
            }
        }
    }
}
