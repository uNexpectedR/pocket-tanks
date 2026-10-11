import QtQuick 2.15
import QtQuick.Window 2.15
import QtQuick.Controls 2.15

ApplicationWindow {
    id: window
    visible: true
    width: 960
    height: 640
    title: "Logos Runner"
    color: "#070b12"

    Loader {
        anchors.fill: parent
        source: "qml/Main.qml"
    }
}
