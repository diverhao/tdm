import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI } from "../Elements"

export const Edit = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Edit Display"}>
        <P>
            You can switch a display window to editing mode by clicking the <code>Edit Display</code> in
            the right-click context menu. In the editing mode, a sidebar appears on the right. When there is
            no widget selected, the sidebar shows the Canvas properties; when one widget is selected, the
            sidebar shows the selected widget's properties; when multiple widgets are selected, the sidebar
            shows the overall size and position of all selected widgets.
        </P>

        <H2 registry={registry}>Edit Canvas</H2>
        <P>
            Canvas is a special widget that defines the background of the display window in operation.
            All other regular widgets are sitting on the Canvas. The Canvas size is window size 
            at operation. In editing mode, the Canvas properties can be set in its sidebar.
        </P>

        <IMG src={"resources/help/edit-03.png"} width={"27%"}></IMG>
        <P>
            You can explicitly define the Canvas size in the <code>Width</code> and <code>Height</code> properties
            in the sidebar, or resize the window in editing mode to define the Canvas size. 
            In each TDM display window, we can define one or several macros. All the widgets in this display window
            will honor these definitions. You can add, edit and remove macros on the sidebar.
            In the widget, the macro is wrapped in <code>$&#123;&#125;</code> or <code>$()</code>
        </P>

        <IMG src={"resources/help/edit-04.gif"} width={"80%"}></IMG>

        <P>
            The Canvas grid is for easily controlling the positions of widgets. When we use the mouse to
            move the widgets around, their <code>X</code> and <code>Y</code> are snapped to the adjacent
            horizontal and vertical grid lines. When either grid line spacing is set to 1, the 
            display window won't honor grid in any direction.
        </P>

        <H2 registry={registry}>Edit widgets</H2>

        <P>
            When a widget is selected, an additional black outline shows around the widget. You can move
            the widget by holding and moving the left button. Multiple widgets can be selected by drawing
            a rectangle on Canvas, or holding <code>shift</code> key and clicking each widget. A selected
            widget can be unselected by holding <code>shift</code> key and clicking. Due to the finite
            width of grid lines, the grids are only shown when the spacing is larger than 2.
        </P>

        <P>
            You can resize one or multiple widgets by holding and moving the left button on the edge or corner after selecting
            these widgets.
        </P>

        <IMG src={"resources/help/edit-01.gif"} width={"80%"}></IMG>

        <P>
            To group multiple widgets, first select them, then right click on any such widget,
            then choose the <code>Group Widgets</code> option. After the widgets are grouped, they
            can be selected, moved and resized as a whole. To edit an individual widget inside
            a group, you can double click this widget and edit it. Once the edit is finished, just
            click anywhere else will bring this widget back to its original group.
        </P>

        <IMG src={"resources/help/edit-02.gif"} width={"80%"}></IMG>



        <H2 registry={registry}>General properties of a widget</H2>

        <P>
            Each widget has many properties. Some of them are common amoung most widgets, some of them are specific 
            for this type of widget. The common properties may include position and size, the PV name for this widget
            to display, the font, background and font colors, as well as the rules used for controlling the widget
            apperance at runtime.
        </P>
        <P>
            You can explicitly set the <code>X, Y, Width, Height</code> and <code>Angle</code> in the widget's sidebar.
            Or, you can move or resize the widget to the desired position and size.
        </P>

        <P>
            The channel (PV) name is one of the most important property for a widget. You can input the full PV name, 
            or the one with macro if the macro is defined in the Canvas macro table. Another type of PV name
            is the computed PV. This type of PV can be used in a regular PV name or Rule.
        </P>

        <P>
            Sometimes we want to align the widgets to have same X coordinates or same height. After we have
            selected multiple widgets, the right-click context menu gives the option of aligning widgets, distributing widgets,
            and matching widget sizes.
        </P>

        <P>
            In addition to the X and Y coordinates, each widget on the display window has a Z coordinate.
            It describes if a widgets is on top of another. A widget that is created later has 
            a higher Z coordinate, and hence covers the lower ones. TDM does not explicitly show the
            Z coordinate. But you can bring the widget to the top (front) or bottom (back). You can 
            also bring the widget by one-level higher (forward) or one-level lower (backward).
        </P>

        <P>
            You can view all the widgets by clicking the <code>Widgets</code> on the bottom of the 
            sidebar. The higher Z coodinate widgets are at the end of the list. In this list, you can
            select multiple widgets by holding <code>ctrl</code> key and clicking the items in the list.
            This tool is useful when the widgets are overcrowded and hard to select.
        </P>


        <P>
            You can choose various fonts to visualize the PV name. TDM ships with a few fonts with the software. 
            It also reads the operating system fonts. It should be noted that there is no gaurantee that the operating
            system font is available on another system. It is recommended to use the TDM provided fonts for the widgets.
        </P>

        <P>
            TDM allows users to show mathematical formulas using the <code>Label</code> widget.
        </P>

        <IMG src={"resources/help/edit-05.gif"} width={"80%"}></IMG>

        <P>
            In TDM, color is defined in a color palatte. User can either pick the color on the platte, or 
            input the RGB values in the input boxes.
        </P>

        <P>
            Once the widget property (e.g. size and color) is defined, normally it should be fixed during the operation.
            The Rule allows the property to be changed during runtime. <LINK widget={widget} to={"/GetStarted"}>Get Started</LINK> gives
            a brief tour on how to use Rule.
        </P>

    </ARTICLE>)
};
