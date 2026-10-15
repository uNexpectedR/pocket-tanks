import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15

/*! Host/Join online room popup — copy-friendly code, paste-friendly join. */
Item {
    id: root
    anchors.fill: parent
    z: 40

    property bool open: false
    property string mode: "host"   // host | join
    property var net: null

    signal hostRequested()
    signal joinRequested(string code)
    signal dismissed()

    readonly property color ink: "#e8e2d6"
    readonly property color muted: "#9a9488"
    readonly property color accent: "#c48c48"
    readonly property color panel: "#141a22"
    readonly property color line: "#3a4238aa"

    property string copyHint: ""
    property bool started: false

    function openHost() {
        mode = "host"
        started = false
        copyHint = ""
        joinField.text = ""
        open = true
        hostRequested()
        started = true
    }

    function openJoin() {
        mode = "join"
        started = false
        copyHint = ""
        joinField.text = ""
        open = true
        focusJoin.restart()
    }

    function close() {
        open = false
        dismissed()
    }

    function copyCode() {
        if (!net || !net.roomCode)
            return
        clipHelper.text = net.roomCode
        clipHelper.selectAll()
        clipHelper.copy()
        copyHint = "Copied"
        copyHintReset.restart()
    }

    function pasteIntoJoin() {
        joinField.forceActiveFocus()
        joinField.paste()
    }

    function submitJoin() {
        var code = joinField.text
        if (!code || String(code).replace(/\s+/g, "").length < 4)
            return
        started = true
        joinRequested(code)
    }

    readonly property bool isError: net && net.status === "error"
    readonly property bool isReady: net && net.roomReady && net.roomCode
    readonly property bool isConnecting: net && (net.status === "connecting" || net.bringUpBusy)

    Rectangle {
        anchors.fill: parent
        color: "#05080ccc"
        MouseArea {
            anchors.fill: parent
            onClicked: root.close()
        }
    }

    Rectangle {
        id: card
        width: Math.min(parent.width - 48, 400)
        anchors.centerIn: parent
        radius: 4
        color: panel
        border.color: line
        border.width: 1
        height: body.implicitHeight + 40

        // Block clicks from closing via scrim.
        MouseArea {
            anchors.fill: parent
            onClicked: {}
        }

        ColumnLayout {
            id: body
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.top: parent.top
            anchors.margins: 20
            spacing: 14

            RowLayout {
                Layout.fillWidth: true
                Text {
                    Layout.fillWidth: true
                    text: root.mode === "host" ? "Host online" : "Join online"
                    color: ink
                    font.family: "IBM Plex Serif"
                    font.pixelSize: 22
                    font.weight: Font.Medium
                }
                Button {
                    id: closeBtn
                    text: "✕"
                    flat: true
                    onClicked: root.close()
                    contentItem: Text {
                        text: closeBtn.text
                        color: muted
                        font.pixelSize: 16
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    background: Item { implicitWidth: 28; implicitHeight: 28 }
                }
            }

            Text {
                Layout.fillWidth: true
                text: root.mode === "host"
                      ? "Share this code with the other Mac. Match starts when they join."
                      : "Paste the host’s room code, then join."
                color: muted
                font.family: "IBM Plex Sans"
                font.pixelSize: 13
                wrapMode: Text.WordWrap
            }

            // —— Host: code + copy ——
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 10
                visible: root.mode === "host"

                Rectangle {
                    Layout.fillWidth: true
                    implicitHeight: 64
                    radius: 2
                    color: "#0c1218"
                    border.color: line
                    border.width: 1

                    Text {
                        anchors.centerIn: parent
                        text: {
                            if (root.isError)
                                return "—"
                            if (net && net.roomCode)
                                return net.roomCode
                            return "······"
                        }
                        color: ink
                        font.family: "IBM Plex Sans"
                        font.pixelSize: 28
                        font.letterSpacing: 4
                        font.bold: true
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    Button {
                        id: copyBtn
                        Layout.fillWidth: true
                        text: root.copyHint || "Copy code"
                        enabled: !!(net && net.roomCode)
                        onClicked: root.copyCode()
                        contentItem: Text {
                            text: copyBtn.text
                            color: copyBtn.enabled ? "#12161c" : muted
                            font.family: "IBM Plex Sans"
                            font.pixelSize: 14
                            font.bold: true
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        background: Rectangle {
                            implicitHeight: 44
                            color: copyBtn.enabled ? (copyBtn.down ? "#e2b57a" : accent) : "#243040"
                            radius: 2
                        }
                    }
                }
            }

            // —— Join: paste field ——
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 10
                visible: root.mode === "join"

                TextField {
                    id: joinField
                    Layout.fillWidth: true
                    placeholderText: "Room code"
                    color: ink
                    font.family: "IBM Plex Sans"
                    font.pixelSize: 18
                    font.capitalization: Font.AllUppercase
                    font.letterSpacing: 2
                    selectByMouse: true
                    horizontalAlignment: Text.AlignHCenter
                    Keys.onReturnPressed: root.submitJoin()
                    Keys.onEnterPressed: root.submitJoin()
                    background: Rectangle {
                        color: "#0c1218"
                        border.color: joinField.activeFocus ? accent : line
                        border.width: 1
                        radius: 2
                        implicitHeight: 52
                    }
                }

                RowLayout {
                    Layout.fillWidth: true
                    spacing: 8

                    Button {
                        id: pasteBtn
                        text: "Paste"
                        onClicked: root.pasteIntoJoin()
                        contentItem: Text {
                            text: pasteBtn.text
                            color: ink
                            font.family: "IBM Plex Sans"
                            font.pixelSize: 13
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

                    Button {
                        id: joinBtn
                        Layout.fillWidth: true
                        text: root.isConnecting ? "Joining…" : "Join"
                        enabled: !root.isConnecting && joinField.text.length >= 4
                        onClicked: root.submitJoin()
                        contentItem: Text {
                            text: joinBtn.text
                            color: joinBtn.enabled ? "#12161c" : muted
                            font.family: "IBM Plex Sans"
                            font.pixelSize: 14
                            font.bold: true
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }
                        background: Rectangle {
                            implicitHeight: 44
                            color: joinBtn.enabled ? (joinBtn.down ? "#e2b57a" : accent) : "#243040"
                            radius: 2
                        }
                    }
                }
            }

            Text {
                Layout.fillWidth: true
                visible: !!(net && net.detail)
                text: net ? net.detail : ""
                color: root.isError ? "#c45c48" : muted
                font.family: "IBM Plex Sans"
                font.pixelSize: 12
                wrapMode: Text.WordWrap
                horizontalAlignment: Text.AlignHCenter
            }

            Button {
                id: retryBtn
                Layout.fillWidth: true
                visible: root.isError && root.mode === "host"
                text: "Retry"
                onClicked: {
                    root.copyHint = ""
                    root.hostRequested()
                }
                contentItem: Text {
                    text: retryBtn.text
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
        }
    }

    // Hidden field used only for clipboard copy (TextInput.copy).
    TextInput {
        id: clipHelper
        width: 1
        height: 1
        opacity: 0
        readOnly: true
        selectByMouse: true
    }

    Timer {
        id: copyHintReset
        interval: 1600
        onTriggered: root.copyHint = ""
    }

    Timer {
        id: focusJoin
        interval: 30
        repeat: false
        onTriggered: joinField.forceActiveFocus()
    }
}
