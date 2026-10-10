import QtQuick 2.15
import QtQuick.Window 2.15
import QtQuick.Controls 2.15

ApplicationWindow {
    id: window
    visible: true
    width: 960
    height: 640
    title: "Ridge Fire"
    color: "#12161c"

    Loader {
        anchors.fill: parent
        source: "Main.qml"
    }
}
