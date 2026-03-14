import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI, CODE, parseTree, TREE, TREEWRAP } from "../Elements"

const treeStr = `

├── mainProcess
│   ├── archive
│   │   └── Sql.ts
│   ├── arg
│   │   └── ArgParser.ts
│   ├── channel
│   │   ├── CaChannelAgent.ts
│   │   ├── ChannelAgentsManager.ts
│   │   └── LocalChannelAgent.ts
│   ├── file
│   │   ├── DbdFiles.ts
│   │   ├── FileReader.ts
│   │   └── LocalFontsReader.ts
│   ├── global
│   │   ├── GlobalMethods.ts
│   │   └── GlobalVariables.ts
│   ├── helpers
│   │   ├── EdlFileConverter.ts
│   │   └── EdlFileConverterThread.ts
│   ├── log
│   │   └── Log.ts
│   ├── mainProcess
│   │   ├── ApplicationMenu.ts
│   │   ├── CaSnooperServer.ts
│   │   ├── CaswServer.ts
│   │   ├── HttpServer.ts
│   │   ├── IpcManagerOnMainProcess.ts
│   │   ├── IpcManagerOnMainProcesses.ts
│   │   ├── MainProcess.ts
│   │   ├── MainProcesses.ts
│   │   ├── SshClient.ts
│   │   └── SshServer.ts
│   ├── newFile1.edl
│   ├── newFile1.edl~
│   ├── profile
│   │   ├── Profile.ts
│   │   └── Profiles.ts
│   ├── resources
│   │   ├── css
│   │   │   ├── fonts
│   │   │   │   ├── KaTeX_AMS-Regular.ttf
│   │   │   │   ├── KaTeX_AMS-Regular.woff
│   │   │   │   ├── KaTeX_AMS-Regular.woff2
│   │   │   │   ├── KaTeX_Caligraphic-Bold.ttf
│   │   │   │   ├── KaTeX_Caligraphic-Bold.woff
│   │   │   │   ├── KaTeX_Caligraphic-Bold.woff2
│   │   │   │   ├── KaTeX_Caligraphic-Regular.ttf
│   │   │   │   ├── KaTeX_Caligraphic-Regular.woff
│   │   │   │   ├── KaTeX_Caligraphic-Regular.woff2
│   │   │   │   ├── KaTeX_Fraktur-Bold.ttf
│   │   │   │   ├── KaTeX_Fraktur-Bold.woff
│   │   │   │   ├── KaTeX_Fraktur-Bold.woff2
│   │   │   │   ├── KaTeX_Fraktur-Regular.ttf
│   │   │   │   ├── KaTeX_Fraktur-Regular.woff
│   │   │   │   ├── KaTeX_Fraktur-Regular.woff2
│   │   │   │   ├── KaTeX_Main-Bold.ttf
│   │   │   │   ├── KaTeX_Main-Bold.woff
│   │   │   │   ├── KaTeX_Main-Bold.woff2
│   │   │   │   ├── KaTeX_Main-BoldItalic.ttf
│   │   │   │   ├── KaTeX_Main-BoldItalic.woff
│   │   │   │   ├── KaTeX_Main-BoldItalic.woff2
│   │   │   │   ├── KaTeX_Main-Italic.ttf
│   │   │   │   ├── KaTeX_Main-Italic.woff
│   │   │   │   ├── KaTeX_Main-Italic.woff2
│   │   │   │   ├── KaTeX_Main-Regular.ttf
│   │   │   │   ├── KaTeX_Main-Regular.woff
│   │   │   │   ├── KaTeX_Main-Regular.woff2
│   │   │   │   ├── KaTeX_Math-BoldItalic.ttf
│   │   │   │   ├── KaTeX_Math-BoldItalic.woff
│   │   │   │   ├── KaTeX_Math-BoldItalic.woff2
│   │   │   │   ├── KaTeX_Math-Italic.ttf
│   │   │   │   ├── KaTeX_Math-Italic.woff
│   │   │   │   ├── KaTeX_Math-Italic.woff2
│   │   │   │   ├── KaTeX_SansSerif-Bold.ttf
│   │   │   │   ├── KaTeX_SansSerif-Bold.woff
│   │   │   │   ├── KaTeX_SansSerif-Bold.woff2
│   │   │   │   ├── KaTeX_SansSerif-Italic.ttf
│   │   │   │   ├── KaTeX_SansSerif-Italic.woff
│   │   │   │   ├── KaTeX_SansSerif-Italic.woff2
│   │   │   │   ├── KaTeX_SansSerif-Regular.ttf
│   │   │   │   ├── KaTeX_SansSerif-Regular.woff
│   │   │   │   ├── KaTeX_SansSerif-Regular.woff2
│   │   │   │   ├── KaTeX_Script-Regular.ttf
│   │   │   │   ├── KaTeX_Script-Regular.woff
│   │   │   │   ├── KaTeX_Script-Regular.woff2
│   │   │   │   ├── KaTeX_Size1-Regular.ttf
│   │   │   │   ├── KaTeX_Size1-Regular.woff
│   │   │   │   ├── KaTeX_Size1-Regular.woff2
│   │   │   │   ├── KaTeX_Size2-Regular.ttf
│   │   │   │   ├── KaTeX_Size2-Regular.woff
│   │   │   │   ├── KaTeX_Size2-Regular.woff2
│   │   │   │   ├── KaTeX_Size3-Regular.ttf
│   │   │   │   ├── KaTeX_Size3-Regular.woff
│   │   │   │   ├── KaTeX_Size3-Regular.woff2
│   │   │   │   ├── KaTeX_Size4-Regular.ttf
│   │   │   │   ├── KaTeX_Size4-Regular.woff
│   │   │   │   ├── KaTeX_Size4-Regular.woff2
│   │   │   │   ├── KaTeX_Typewriter-Regular.ttf
│   │   │   │   ├── KaTeX_Typewriter-Regular.woff
│   │   │   │   └── KaTeX_Typewriter-Regular.woff2
│   │   │   ├── katex.min.css
│   │   │   └── prism.css
│   │   ├── dbd
│   │   │   ├── aaiRecord.dbd
│   │   │   ├── aaoRecord.dbd
│   │   │   ├── aiRecord.dbd
│   │   │   ├── aoRecord.dbd
│   │   │   ├── aSubRecord.dbd
│   │   │   ├── biRecord.dbd
│   │   │   ├── boRecord.dbd
│   │   │   ├── calcoutRecord.dbd
│   │   │   ├── calcRecord.dbd
│   │   │   ├── compressRecord.dbd
│   │   │   ├── dbCommon.dbd
│   │   │   ├── dfanoutRecord.dbd
│   │   │   ├── eventRecord.dbd
│   │   │   ├── fanoutRecord.dbd
│   │   │   ├── histogramRecord.dbd
│   │   │   ├── int64inRecord.dbd
│   │   │   ├── int64outRecord.dbd
│   │   │   ├── longinRecord.dbd
│   │   │   ├── longoutRecord.dbd
│   │   │   ├── lsiRecord.dbd
│   │   │   ├── lsoRecord.dbd
│   │   │   ├── mbbiDirectRecord.dbd
│   │   │   ├── mbbiRecord.dbd
│   │   │   ├── mbboDirectRecord.dbd
│   │   │   ├── mbboRecord.dbd
│   │   │   ├── menuAlarmSevr.dbd
│   │   │   ├── menuAlarmStat.dbd
│   │   │   ├── menuConvert.dbd
│   │   │   ├── menuFtype.dbd
│   │   │   ├── menuGlobal.dbd
│   │   │   ├── menuIvoa.dbd
│   │   │   ├── menuOmsl.dbd
│   │   │   ├── menuPini.dbd
│   │   │   ├── menuPost.dbd
│   │   │   ├── menuPriority.dbd
│   │   │   ├── menuScan.dbd
│   │   │   ├── menuSimm.dbd
│   │   │   ├── menuYesNo.dbd
│   │   │   ├── permissiveRecord.dbd
│   │   │   ├── printfRecord.dbd
│   │   │   ├── pvdbcrAddRecord.dbd
│   │   │   ├── pvdbcrAllRecords.dbd
│   │   │   ├── pvdbcrProcessRecord.dbd
│   │   │   ├── pvdbcrRemoveRecord.dbd
│   │   │   ├── pvdbcrScalarArrayRecord.dbd
│   │   │   ├── pvdbcrScalarRecord.dbd
│   │   │   ├── pvdbcrTraceRecord.dbd
│   │   │   ├── selRecord.dbd
│   │   │   ├── seqRecord.dbd
│   │   │   ├── stateRecord.dbd
│   │   │   ├── stdRecords.dbd
│   │   │   ├── stringinRecord.dbd
│   │   │   ├── stringoutRecord.dbd
│   │   │   ├── subArrayRecord.dbd
│   │   │   ├── subRecord.dbd
│   │   │   └── waveformRecord.dbd
│   │   ├── fonts
│   │   │   ├── CourierPrime
│   │   │   │   ├── CourierPrime.ttf
│   │   │   │   ├── CourierPrimeBold.ttf
│   │   │   │   ├── CourierPrimeBoldItalic.ttf
│   │   │   │   └── CourierPrimeItalic.ttf
│   │   │   ├── Inter
│   │   │   │   ├── Inter-Italic-VariableFont_opsz,wght.ttf
│   │   │   │   └── Inter-VariableFont_opsz.ttf
│   │   │   ├── LiberationSans
│   │   │   │   ├── LiberationSans-Bold.ttf
│   │   │   │   ├── LiberationSans-BoldItalic.ttf
│   │   │   │   ├── LiberationSans-Italic.ttf
│   │   │   │   └── LiberationSans-Regular.ttf
│   │   │   ├── Macondo
│   │   │   │   └── Macondo-Regular.ttf
│   │   │   ├── NanumMyeongjo
│   │   │   │   ├── NanumMyeongjo-Bold.ttf
│   │   │   │   ├── NanumMyeongjo-ExtraBold.ttf
│   │   │   │   ├── NanumMyeongjo-Regular.ttf
│   │   │   │   └── OFL.txt
│   │   │   └── Tinos
│   │   │       ├── Tinos-Bold.ttf
│   │   │       ├── Tinos-BoldItalic.ttf
│   │   │       ├── Tinos-Italic.ttf
│   │   │       └── Tinos-Regular.ttf
│   │   ├── help
│   │   │   ├── architect.png
│   │   │   ├── architect2.png
│   │   │   ├── edit-01.gif
│   │   │   ├── edit-02.gif
│   │   │   ├── edit-03.png
│   │   │   ├── edit-04.gif
│   │   │   ├── edit-05.gif
│   │   │   ├── empty-display-window-editing.png
│   │   │   ├── getStarted-00.png
│   │   │   ├── getStarted-01.gif
│   │   │   ├── getStarted-02.gif
│   │   │   ├── getStarted-03.png
│   │   │   ├── getStarted-04.gif
│   │   │   ├── getStarted-05.gif
│   │   │   ├── getStarted-06.gif
│   │   │   ├── getStarted-07.png
│   │   │   ├── getStarted-08.gif
│   │   │   ├── getStarted-09.gif
│   │   │   ├── getStarted-casnooper.png
│   │   │   ├── getStarted-casw.png
│   │   │   ├── getStarted-channelgraph.png
│   │   │   ├── getStarted-dataviewer.png
│   │   │   ├── getStarted-file-converter.png
│   │   │   ├── getStarted-probe.png
│   │   │   ├── getStarted-profile-runtime-info.png
│   │   │   ├── getStarted-pvtable.png
│   │   │   ├── getStarted-seqgraph.png
│   │   │   ├── operation-01.png
│   │   │   ├── Profile-01.png
│   │   │   ├── tdm-chatbase.gif
│   │   │   ├── usage-example-01.png
│   │   │   ├── usage-example-02.png
│   │   │   ├── usage-example-03.gif
│   │   │   ├── usage-example-04.gif
│   │   │   ├── usage-example-05.gif
│   │   │   ├── usage-example-06.png
│   │   │   ├── usage-example-07.gif
│   │   │   └── usage-example-08.png
│   │   ├── js
│   │   │   └── prism.js
│   │   ├── profiles
│   │   │   └── profiles-sns-office-user.json
│   │   ├── tdls
│   │   │   ├── blank-red.tdl
│   │   │   ├── blank-transparent.tdl
│   │   │   ├── blank-white.tdl
│   │   │   ├── blank.html
│   │   │   ├── GetStarted.tdl
│   │   │   └── profiles_default.json
│   │   └── webpages
│   │       ├── add-child-symbol.svg
│   │       ├── add-symbol.svg
│   │       ├── arrowDown-2.svg
│   │       ├── arrowDown-thin.svg
│   │       ├── arrowDown.svg
│   │       ├── arrowRight-thin-white.svg
│   │       ├── arrowUp-2.svg
│   │       ├── arrowUp-thin.svg
│   │       ├── arrowUp.svg
│   │       ├── atom.svg
│   │       ├── blank.svg
│   │       ├── chemistry.svg
│   │       ├── copy-symbol.svg
│   │       ├── delete-symbol.svg
│   │       ├── details-symbol.svg
│   │       ├── dna.svg
│   │       ├── document-symbol.svg
│   │       ├── download-from-cloud-symbol.svg
│   │       ├── folder-symbol.svg
│   │       ├── horizontal-pan-left.svg
│   │       ├── horizontal-pan-right.svg
│   │       ├── horizontal-zoom-in.svg
│   │       ├── horizontal-zoom-out.svg
│   │       ├── icon.png
│   │       ├── legend-symbol.svg
│   │       ├── login.html
│   │       ├── modify-symbol.svg
│   │       ├── old-logos
│   │       │   ├── icon.icns
│   │       │   ├── icon.ico
│   │       │   ├── tdm-logo-round-corner.png
│   │       │   ├── tdm-logo.png
│   │       │   └── tdm-logo.svg
│   │       ├── opacity-bar.png
│   │       ├── open-file-symbol.svg
│   │       ├── open-link-symbol.svg
│   │       ├── pause.svg
│   │       ├── play.svg
│   │       ├── refresh-symbol.svg
│   │       ├── save-to-file.svg
│   │       ├── scale-2y.svg
│   │       ├── scale-y.svg
│   │       ├── settings.svg
│   │       ├── Spallation_neutron_source_logo.png
│   │       ├── star.svg
│   │       ├── tdm-logo-large-fill.png
│   │       ├── tdm-logo.png
│   │       ├── tdm-logo.svg
│   │       ├── tdm.png
│   │       ├── tdm.svg
│   │       ├── trend.svg
│   │       ├── vertical-pan-down.svg
│   │       ├── vertical-pan-up.svg
│   │       ├── vertical-zoom-in.svg
│   │       ├── vertical-zoom-out.svg
│   │       └── web-symbol.svg
│   ├── startMainProcess.ts
│   ├── windows
│   │   ├── DisplayWindow
│   │   │   ├── BobPropertyConverter.ts
│   │   │   ├── ContextMenu.tsx
│   │   │   ├── ContextMenuDesktop.ts
│   │   │   ├── DisplayWindow-web.html
│   │   │   ├── DisplayWindow.html
│   │   │   ├── DisplayWindowAgent.ts
│   │   │   ├── DisplayWindowClient.tsx
│   │   │   ├── EdlConverter.ts
│   │   │   ├── IpcManagerOnDisplayWindow.ts
│   │   │   └── StpConverter.ts
│   │   ├── HelpWindow
│   │   │   ├── HelpWindow-web.html
│   │   │   ├── HelpWindow.html
│   │   │   └── HelpWindowClient.tsx
│   │   ├── MainWindow
│   │   │   ├── IpcManagerOnMainWindow.ts
│   │   │   ├── MainWindow-web.html
│   │   │   ├── MainWindow.html
│   │   │   ├── MainWindowAgent.ts
│   │   │   └── MainWindowClient.tsx
│   │   ├── UtilityWindow
│   │   │   └── UtilityWindowFactory.ts
│   │   └── WindowAgentsManager.ts
│   ├── wsOpener
│   │   └── WsOpenerServer.ts
│   └── wsPv
│       ├── WsPvClient.py
│       ├── WsPvClient.ts
│       └── WsPvServer.ts
├── rendererProcess
│   ├── channel
│   │   ├── DbdFiles.ts
│   │   ├── Promises.ts
│   │   ├── ReadWriteIos.ts
│   │   └── TcaChannel.ts
│   ├── global
│   │   ├── EditorHistories.ts
│   │   ├── EditorHistory.ts
│   │   ├── FontsData.ts
│   │   ├── GlobalMethods.tsx
│   │   ├── GlobalVariables.tsx
│   │   └── Widgets.tsx
│   ├── helperWidgets
│   │   ├── Canvas
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasHelper.ts
│   │   │   └── CanvasSidebar.tsx
│   │   ├── ColorPicker
│   │   │   ├── Collapsible.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── Helper.tsx
│   │   │   ├── HexInput.tsx
│   │   │   ├── HSVPicker.tsx
│   │   │   ├── OpacityPicker.tsx
│   │   │   ├── PresetColor.tsx
│   │   │   ├── PresetColors.tsx
│   │   │   └── RGBInput.tsx
│   │   ├── EdmSymbol
│   │   │   └── EdmSymbolHelper.tsx
│   │   ├── ErrorBoundary
│   │   │   └── ErrorBoundary.tsx
│   │   ├── GroupSelection
│   │   │   ├── GroupSelection2.tsx
│   │   │   └── GroupSelectionSidebar2.tsx
│   │   ├── Help
│   │   │   ├── contents
│   │   │   │   ├── ConfigureWebServer.tsx
│   │   │   │   ├── Dummy.tsx
│   │   │   │   ├── Edit.tsx
│   │   │   │   ├── GetStarted.tsx
│   │   │   │   ├── Macro.tsx
│   │   │   │   ├── Operation.tsx
│   │   │   │   ├── Overview.tsx
│   │   │   │   ├── Profile.tsx
│   │   │   │   └── TechnicalOverview.tsx
│   │   │   ├── Elements.tsx
│   │   │   └── Help.tsx
│   │   ├── MouseSelectionRegion
│   │   │   └── MouseSelectionRegion.tsx
│   │   ├── Prompt
│   │   │   ├── Prompt.tsx
│   │   │   ├── PromptOnDisplayWindow.tsx
│   │   │   └── PromptOnMainWindow.tsx
│   │   ├── Root
│   │   │   └── Root.tsx
│   │   ├── RuleComponents
│   │   │   ├── RuleAlarmBorder.tsx
│   │   │   ├── RuleAngle.tsx
│   │   │   ├── RuleArcAngleRange.tsx
│   │   │   ├── RuleArcAngleStart.tsx
│   │   │   ├── RuleArcShowRadius.tsx
│   │   │   ├── RuleBackgroundColor.tsx
│   │   │   ├── RuleBooleanButtonOffColor.tsx
│   │   │   ├── RuleBooleanButtonOnColor.tsx
│   │   │   ├── RuleBooleanButtonShowLED.tsx
│   │   │   ├── RuleBooleanButtonUsePictures.tsx
│   │   │   ├── RuleBorderColor.tsx
│   │   │   ├── RuleBorderWidth.tsx
│   │   │   ├── RuleByteMonitorBitLength.tsx
│   │   │   ├── RuleByteMonitorBitStart.tsx
│   │   │   ├── RuleByteMonitorSequence.tsx
│   │   │   ├── RuleCheckBoxSize.tsx
│   │   │   ├── RuleChoiceButtonSelectedBackgroundColor.tsx
│   │   │   ├── RuleChoiceButtonUnselectedBackgroundColor.tsx
│   │   │   ├── RuleChoiceButtonUseChannelItems.tsx
│   │   │   ├── RuleColor.tsx
│   │   │   ├── RuleComponent.tsx
│   │   │   ├── RuleDirection.tsx
│   │   │   ├── RuleEmbeddedDisplaySelectTabIndex.tsx
│   │   │   ├── RuleFillColor.tsx
│   │   │   ├── RuleFontSize.tsx
│   │   │   ├── RuleHeight.tsx
│   │   │   ├── RuleHighlightBackgroundColor.tsx
│   │   │   ├── RuleInvalidSeverityColor.tsx
│   │   │   ├── RuleInvisibleInOperation.tsx
│   │   │   ├── RuleLEDBit.tsx
│   │   │   ├── RuleLEDFallbackColor.tsx
│   │   │   ├── RuleLEDMultiStateFallbackText.tsx
│   │   │   ├── RuleLEDShape.tsx
│   │   │   ├── RuleLineColor.tsx
│   │   │   ├── RuleLineStyle.tsx
│   │   │   ├── RuleLineWidth.tsx
│   │   │   ├── RuleMajorSeverityColor.tsx
│   │   │   ├── RuleMaxPvValue.tsx
│   │   │   ├── RuleMediaDefaultFileName.tsx
│   │   │   ├── RuleMeterAngleRange.tsx
│   │   │   ├── RuleMeterDialColor.tsx
│   │   │   ├── RuleMeterDialFontColor.tsx
│   │   │   ├── RuleMeterDialFontSize.tsx
│   │   │   ├── RuleMeterDialPercentage.tsx
│   │   │   ├── RuleMeterDialThickness.tsx
│   │   │   ├── RuleMeterLabelPositionPercentage.tsx
│   │   │   ├── RuleMeterPointerColor.tsx
│   │   │   ├── RuleMeterPointerLengthPercentage.tsx
│   │   │   ├── RuleMeterPointerThickness.tsx
│   │   │   ├── RuleMinorSeverityColor.tsx
│   │   │   ├── RuleMinPvValue.tsx
│   │   │   ├── RuleOutlineColor.tsx
│   │   │   ├── RuleOutlineStyle.tsx
│   │   │   ├── RuleOutlineWidth.tsx
│   │   │   ├── RulePictureOpacity.tsx
│   │   │   ├── RulePictureStretchToFit.tsx
│   │   │   ├── RulePolylineArrowLength.tsx
│   │   │   ├── RulePolylineArrowWidth.tsx
│   │   │   ├── RulePolylineClosed.tsx
│   │   │   ├── RulePolylineFill.tsx
│   │   │   ├── RulePolylineSmootherize.tsx
│   │   │   ├── RuleProgressBarBackgroundColor.tsx
│   │   │   ├── RuleRectangleCornerHeight.tsx
│   │   │   ├── RuleRectangleCornerWidth.tsx
│   │   │   ├── RuleScaledSliderSliderBlockWidth.tsx
│   │   │   ├── RuleShowArrowHead.tsx
│   │   │   ├── RuleShowArrowTail.tsx
│   │   │   ├── RuleShowPvValue.tsx
│   │   │   ├── RuleShowUnit.tsx
│   │   │   ├── RuleSlideButtonBoxRatio.tsx
│   │   │   ├── RuleSlideButtonBoxWidth.tsx
│   │   │   ├── RuleStepSize.tsx
│   │   │   ├── RuleTankShowLabels.tsx
│   │   │   ├── RuleText.tsx
│   │   │   ├── RuleThermometerBulbDiameter.tsx
│   │   │   ├── RuleThermometerTubeWidth.tsx
│   │   │   ├── RuleThermometerWallColor.tsx
│   │   │   ├── RuleThermometerWallThickness.tsx
│   │   │   ├── RuleUseLogScale.tsx
│   │   │   ├── RuleUsePvLimits.tsx
│   │   │   ├── RuleWidth.tsx
│   │   │   ├── RuleWrapWord.tsx
│   │   │   ├── RuleX.tsx
│   │   │   ├── RuleXAlign.tsx
│   │   │   ├── RuleY.tsx
│   │   │   └── RuleYAlign.tsx
│   │   ├── SharedElements
│   │   │   ├── DropDownMenu.tsx
│   │   │   ├── MacrosTable.tsx
│   │   │   └── RectangleButton.tsx
│   │   ├── SidebarComponents
│   │   │   ├── SidebarActionCloseDisplayWindowItem.tsx
│   │   │   ├── SidebarActionExecuteCommandItem.tsx
│   │   │   ├── SidebarActionItems.tsx
│   │   │   ├── SidebarActionOpenDisplayItem.tsx
│   │   │   ├── SidebarActionOpenWebpageItem.tsx
│   │   │   ├── SidebarActionWritePvItem.tsx
│   │   │   ├── SidebarAlarmBackground.tsx
│   │   │   ├── SidebarAlarmBorder.tsx
│   │   │   ├── SidebarAlarmDial.tsx
│   │   │   ├── SidebarAlarmFill.tsx
│   │   │   ├── SidebarAlarmLevel.tsx
│   │   │   ├── SidebarAlarmPointer.tsx
│   │   │   ├── SidebarAlarmShape.tsx
│   │   │   ├── SidebarAlarmText.tsx
│   │   │   ├── SidebarAngle.tsx
│   │   │   ├── SidebarArcAngleRange.tsx
│   │   │   ├── SidebarArcAngleStart.tsx
│   │   │   ├── SidebarArcShowRadius.tsx
│   │   │   ├── SidebarBackgroundColor.tsx
│   │   │   ├── SidebarBooleanButtonMode.tsx
│   │   │   ├── SidebarBooleanButtonOffColor.tsx
│   │   │   ├── SidebarBooleanButtonOffLabel.tsx
│   │   │   ├── SidebarBooleanButtonOffValue.tsx
│   │   │   ├── SidebarBooleanButtonOnColor.tsx
│   │   │   ├── SidebarBooleanButtonOnLabel.tsx
│   │   │   ├── SidebarBooleanButtonOnValue.tsx
│   │   │   ├── SidebarBooleanButtonShowLED.tsx
│   │   │   ├── SidebarBooleanButtonUsePictures.tsx
│   │   │   ├── SidebarBorderColor.tsx
│   │   │   ├── SidebarBorderWidth.tsx
│   │   │   ├── SidebarByteMonitorBitLength.tsx
│   │   │   ├── SidebarByteMonitorBitNamesTable.tsx
│   │   │   ├── SidebarByteMonitorBitStart.tsx
│   │   │   ├── SidebarByteMonitorBitValueColors.tsx
│   │   │   ├── SidebarByteMonitorSequence.tsx
│   │   │   ├── SidebarCanvasScript.tsx
│   │   │   ├── SidebarChannelName.tsx
│   │   │   ├── SidebarChannelNames.tsx
│   │   │   ├── SidebarCheckBoxSize.tsx
│   │   │   ├── SidebarChoiceButtonItem.tsx
│   │   │   ├── SidebarChoiceButtonItems.tsx
│   │   │   ├── SidebarChoiceButtonSelectedBackgroundColor.tsx
│   │   │   ├── SidebarChoiceButtonUnselectedBackgroundColor.tsx
│   │   │   ├── SidebarChoiceButtonUseChannelItems.tsx
│   │   │   ├── SidebarComponent.tsx
│   │   │   ├── SidebarDataViewerChannelNames.tsx
│   │   │   ├── SidebarDirection.tsx
│   │   │   ├── SidebarDisplayScale.tsx
│   │   │   ├── SidebarEmbeddedDisplayItem.tsx
│   │   │   ├── SidebarEmbeddedDisplayItems.tsx
│   │   │   ├── SidebarEmbeddedDisplayShowTab.tsx
│   │   │   ├── SidebarEmbeddedDisplayTabDefaultColor.tsx
│   │   │   ├── SidebarEmbeddedDisplayTabHeight.tsx
│   │   │   ├── SidebarEmbeddedDisplayTabPosition.tsx
│   │   │   ├── SidebarEmbeddedDisplayTabSelectedColor.tsx
│   │   │   ├── SidebarEmbeddedDisplayTabWidth.tsx
│   │   │   ├── SidebarFileBrowserPath.tsx
│   │   │   ├── SidebarFillColor.tsx
│   │   │   ├── SidebarFillColorInvalid.tsx
│   │   │   ├── SidebarFillColorMajor.tsx
│   │   │   ├── SidebarFillColorMinor.tsx
│   │   │   ├── SidebarFontFamily.tsx
│   │   │   ├── SidebarFontSize.tsx
│   │   │   ├── SidebarFontStyle.tsx
│   │   │   ├── SidebarFontWeight.tsx
│   │   │   ├── SidebarGroupItem.tsx
│   │   │   ├── SidebarGroupItems.tsx
│   │   │   ├── SidebarHeight.tsx
│   │   │   ├── SidebarHighlightBackgroundColor.tsx
│   │   │   ├── SidebarInvalidSeverityColor.tsx
│   │   │   ├── SidebarInvisibleInOperation.tsx
│   │   │   ├── SidebarLEDBit.tsx
│   │   │   ├── SidebarLEDFallbackColor.tsx
│   │   │   ├── SidebarLEDItem.tsx
│   │   │   ├── SidebarLEDItems.tsx
│   │   │   ├── SidebarLEDMultiStateFallbackText.tsx
│   │   │   ├── SidebarLEDMultiStateItem.tsx
│   │   │   ├── SidebarLEDMultiStateItems.tsx
│   │   │   ├── SidebarLEDShape.tsx
│   │   │   ├── SidebarLineArrowStyle.tsx
│   │   │   ├── SidebarLineColor.tsx
│   │   │   ├── SidebarLineStyle.tsx
│   │   │   ├── SidebarLineWidth.tsx
│   │   │   ├── SidebarMajorSeverityColor.tsx
│   │   │   ├── SidebarMaxPvValue.tsx
│   │   │   ├── SidebarMediaOpenFile.tsx
│   │   │   ├── SidebarMeterAngleRange.tsx
│   │   │   ├── SidebarMeterDialColor.tsx
│   │   │   ├── SidebarMeterDialPercentage.tsx
│   │   │   ├── SidebarMeterDialThickness.tsx
│   │   │   ├── SidebarMeterLabelPositionPercentage.tsx
│   │   │   ├── SidebarMeterPointerColor.tsx
│   │   │   ├── SidebarMeterPointerLengthPercentage.tsx
│   │   │   ├── SidebarMeterPointerThickness.tsx
│   │   │   ├── SidebarMinorSeverityColor.tsx
│   │   │   ├── SidebarMinPvValue.tsx
│   │   │   ├── SidebarNumberFormat.tsx
│   │   │   ├── SidebarNumberScale.tsx
│   │   │   ├── SidebarOverflowVisible.tsx
│   │   │   ├── SidebarPictureOpacity.tsx
│   │   │   ├── SidebarPictureStretchToFit.tsx
│   │   │   ├── SidebarPolylineClosed.tsx
│   │   │   ├── SidebarPolylineFill.tsx
│   │   │   ├── SidebarPolylinePointsTable.tsx
│   │   │   ├── SidebarPolylineSmootherize.tsx
│   │   │   ├── SidebarProgressbarBackgroundColor.tsx
│   │   │   ├── SidebarPvMonitorMaxLineNum.tsx
│   │   │   ├── SidebarPvTableProperties.tsx
│   │   │   ├── SidebarRectangleCornerHeight.tsx
│   │   │   ├── SidebarRectangleCornerWidth.tsx
│   │   │   ├── SidebarScaledSliderAppearance.tsx
│   │   │   ├── SidebarScaledSliderCompactScale.tsx
│   │   │   ├── SidebarScaledSliderNumTickIntervals.tsx
│   │   │   ├── SidebarScaledSliderSliderBarBackgroundColor.tsx
│   │   │   ├── SidebarScaledSliderSliderBarBackgroundColor1.tsx
│   │   │   ├── SidebarShowLegend.tsx
│   │   │   ├── SidebarShowPvValue.tsx
│   │   │   ├── SidebarShowUnit.tsx
│   │   │   ├── SidebarSlideButtonBoxRatio.tsx
│   │   │   ├── SidebarSlideButtonBoxWidth.tsx
│   │   │   ├── SidebarSlideButtonItem.tsx
│   │   │   ├── SidebarSlideButtonItems.tsx
│   │   │   ├── SidebarStepSize.tsx
│   │   │   ├── SidebarSymbolItem.tsx
│   │   │   ├── SidebarSymbolItems.tsx
│   │   │   ├── SidebarTableRowsConfig.tsx
│   │   │   ├── SidebarTankAlarmContainer.tsx
│   │   │   ├── SidebarTankContainerColor.tsx
│   │   │   ├── SidebarTankScalePosition.tsx
│   │   │   ├── SidebarTankShowLabels.tsx
│   │   │   ├── SidebarTankShowScaleInnerLabel.tsx
│   │   │   ├── SidebarText.tsx
│   │   │   ├── SidebarTextColor.tsx
│   │   │   ├── SidebarThermometerBulbDiameter.tsx
│   │   │   ├── SidebarThermometerTubeWidth.tsx
│   │   │   ├── SidebarThermometerWallColor.tsx
│   │   │   ├── SidebarThermometerWallThickness.tsx
│   │   │   ├── SidebarUseLogScale.tsx
│   │   │   ├── SidebarUsePvLimits.tsx
│   │   │   ├── SidebarWidgetAppearance.tsx
│   │   │   ├── SidebarWidgetsList.tsx
│   │   │   ├── SidebarWidth.tsx
│   │   │   ├── SidebarWrapWord.tsx
│   │   │   ├── SidebarWriteConfirmation.tsx
│   │   │   ├── SidebarX.tsx
│   │   │   ├── SidebarXAlign.tsx
│   │   │   ├── SidebarXYPlotXAxis.tsx
│   │   │   ├── SidebarXYPlotYAxes.tsx
│   │   │   ├── SidebarXYPlotYAxis.tsx
│   │   │   ├── SidebarY.tsx
│   │   │   └── SidebarYAlign.tsx
│   │   ├── Table
│   │   │   └── Table.tsx
│   │   └── VideoRecorder
│   │       └── VideoRecorder.ts
│   ├── history
│   │   └── ActionHistory.ts
│   ├── keyboard
│   │   └── Keyboard.ts
│   ├── mainWindow
│   │   ├── GlobalVariables.ts
│   │   ├── MainWindowProfileEditPage.tsx
│   │   ├── MainWindowProfileRunPage.tsx
│   │   ├── MainWindowStartupPage.tsx
│   │   └── MainWindowStyledComponents.tsx
│   └── widgets
│       ├── ActionButton
│       │   ├── ActionButton.tsx
│       │   ├── ActionButtonHelper.ts
│       │   ├── ActionButtonRule.tsx
│       │   ├── ActionButtonRules.tsx
│       │   └── ActionButtonSidebar.tsx
│       ├── Arc
│       │   ├── Arc.tsx
│       │   ├── ArcHelper.ts
│       │   ├── ArcRule.tsx
│       │   ├── ArcRules.tsx
│       │   └── ArcSidebar.tsx
│       ├── BaseWidget
│       │   ├── BaseWidget.tsx
│       │   ├── BaseWidgetHelper.ts
│       │   ├── BaseWidgetRule.tsx
│       │   ├── BaseWidgetRules.tsx
│       │   ├── BaseWidgetSidebar.tsx
│       │   └── SidebarLargeInput.tsx
│       ├── BinaryImage
│       │   ├── BinaryImage.tsx
│       │   ├── BinaryImageRule.tsx
│       │   ├── BinaryImageRules.tsx
│       │   └── BinaryImageSidebar.tsx
│       ├── BooleanButton
│       │   ├── BooleanButton.tsx
│       │   ├── BooleanButtonHelper.ts
│       │   ├── BooleanButtonRule.tsx
│       │   ├── BooleanButtonRules.tsx
│       │   └── BooleanButtonSidebar.tsx
│       ├── ByteMonitor
│       │   ├── ByteMonitor.tsx
│       │   ├── ByteMonitorHelper.ts
│       │   ├── ByteMonitorRule.tsx
│       │   ├── ByteMonitorRules.tsx
│       │   └── ByteMonitorSidebar.tsx
│       ├── Calculator
│       │   ├── Calculator.tsx
│       │   └── CalculatorSidebar.tsx
│       ├── CaSnooper
│       │   └── CaSnooper.tsx
│       ├── Casw
│       │   └── Casw.tsx
│       ├── ChannelGraph
│       │   ├── ChannelGraph.tsx
│       │   └── ChannelGraphSidebar.tsx
│       ├── CheckBox
│       │   ├── CheckBox.tsx
│       │   ├── CheckBoxHelper.ts
│       │   ├── CheckBoxRule.tsx
│       │   ├── CheckBoxRules.tsx
│       │   └── CheckBoxSidebar.tsx
│       ├── ChoiceButton
│       │   ├── ChoiceButton.tsx
│       │   ├── ChoiceButtonHelper.ts
│       │   ├── ChoiceButtonRule.tsx
│       │   ├── ChoiceButtonRules.tsx
│       │   └── ChoiceButtonSidebar.tsx
│       ├── ComboBox
│       │   ├── ComboBox.tsx
│       │   ├── ComboBoxHelper.ts
│       │   ├── ComboBoxRule.tsx
│       │   ├── ComboBoxRules.tsx
│       │   └── ComboBoxSidebar.tsx
│       ├── DataViewer
│       │   ├── DataViewer.tsx
│       │   ├── DataViewerHelper.ts
│       │   ├── DataViewerPlot.tsx
│       │   ├── DataViewerSettings.tsx
│       │   └── DataViewerSidebar.tsx
│       ├── EmbeddedDisplay
│       │   ├── EmbeddedDisplay.tsx
│       │   ├── EmbeddedDisplayHelper.ts
│       │   ├── EmbeddedDisplayRule.tsx
│       │   ├── EmbeddedDisplayRules.tsx
│       │   └── EmbeddedDisplaySidebar.tsx
│       ├── FileBrowser
│       │   ├── FileBrowser.tsx
│       │   └── FileBrowserSidebar.tsx
│       ├── FileConverter
│       │   └── FileConverter.tsx
│       ├── Group
│       │   ├── Group.tsx
│       │   └── GroupSidebar.tsx
│       ├── Label
│       │   ├── Label.tsx
│       │   ├── LabelHelper.ts
│       │   ├── LabelRule.tsx
│       │   ├── LabelRules.tsx
│       │   └── LabelSidebar.tsx
│       ├── LED
│       │   ├── LED.tsx
│       │   ├── LEDHelper.ts
│       │   ├── LEDRule.tsx
│       │   ├── LEDRules.tsx
│       │   └── LEDSidebar.tsx
│       ├── LEDMultiState
│       │   ├── LEDMultiState.tsx
│       │   ├── LEDMultiStateHelper.ts
│       │   ├── LEDMultiStateRule.tsx
│       │   ├── LEDMultiStateRules.tsx
│       │   └── LEDMultiStateSidebar.tsx
│       ├── LogViewer
│       │   └── LogViewer.tsx
│       ├── Media
│       │   ├── Media.tsx
│       │   ├── MediaHelper.ts
│       │   ├── MediaRule.tsx
│       │   ├── MediaRules.tsx
│       │   └── MediaSidebar.tsx
│       ├── Meter
│       │   ├── Meter.tsx
│       │   ├── MeterHelper.ts
│       │   ├── MeterRule.tsx
│       │   ├── MeterRules.tsx
│       │   └── MeterSidebar.tsx
│       ├── Polyline
│       │   ├── Polyline.tsx
│       │   ├── PolylineHelper.ts
│       │   ├── PolylineRule.tsx
│       │   ├── PolylineRules.tsx
│       │   ├── PolylineSidebar.tsx
│       │   └── PolylineSmoother.tsx
│       ├── Probe
│       │   ├── Probe.tsx
│       │   └── ProbeSidebar.tsx
│       ├── ProfilesViewer
│       │   └── ProfilesViewer.tsx
│       ├── PvMonitor
│       │   ├── PvMonitor.tsx
│       │   └── PvMonitorSidebar.tsx
│       ├── PvTable
│       │   ├── PvTable.tsx
│       │   ├── PvTableSettings.tsx
│       │   └── PvTableSidebar.tsx
│       ├── RadioButton
│       │   ├── RadioButton.tsx
│       │   ├── RadioButtonHelper.ts
│       │   ├── RadioButtonRule.tsx
│       │   ├── RadioButtonRules.tsx
│       │   └── RadioButtonSidebar.tsx
│       ├── Rectangle
│       │   ├── Rectangle.tsx
│       │   ├── RectangleHelper.ts
│       │   ├── RectangleRule.tsx
│       │   ├── RectangleRules.tsx
│       │   └── RectangleSidebar.tsx
│       ├── ScaledSlider
│       │   ├── ScaledSlider.tsx
│       │   ├── ScaledSliderHelper.ts
│       │   ├── ScaledSliderRule.tsx
│       │   ├── ScaledSliderRules.tsx
│       │   └── ScaledSliderSidebar.tsx
│       ├── SeqGraph
│       │   ├── SeqGraph.tsx
│       │   ├── SeqGraphSidebar.tsx
│       │   ├── SeqParser.ts
│       │   └── SeqProgram.ts
│       ├── SlideButton
│       │   ├── SlideButton.tsx
│       │   ├── SlideButtonRule.tsx
│       │   ├── SlideButtonRules.tsx
│       │   └── SlideButtonSidebar.tsx
│       ├── Spinner
│       │   ├── Spinner.tsx
│       │   ├── SpinnerRule.tsx
│       │   ├── SpinnerRules.tsx
│       │   └── SpinnerSidebar.tsx
│       ├── Symbol
│       │   ├── Symbol.tsx
│       │   ├── SymbolRule.tsx
│       │   ├── SymbolRules.tsx
│       │   └── SymbolSidebar.tsx
│       ├── Table
│       │   ├── Table.tsx
│       │   └── TableSidebar.tsx
│       ├── Talhk
│       │   ├── client
│       │   │   ├── AreaPage.tsx
│       │   │   ├── BasePage.tsx
│       │   │   ├── ConfigPage.tsx
│       │   │   ├── GlobalMethod.ts
│       │   │   ├── MainPage.tsx
│       │   │   ├── PA.ts
│       │   │   ├── RectangleButton.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── TablePage.tsx
│       │   │   └── TreePage.tsx
│       │   └── Talhk.tsx
│       ├── Tank
│       │   ├── Tank.tsx
│       │   ├── TankHelper.ts
│       │   ├── TankRule.tsx
│       │   ├── TankRules.tsx
│       │   └── TankSidebar.tsx
│       ├── TdlViewer
│       │   └── TdlViewer.tsx
│       ├── Terminal
│       │   ├── Terminal.tsx
│       │   ├── TerminalIos.ts
│       │   └── TerminalSidebar.tsx
│       ├── TextEditor
│       │   └── TextEditor.tsx
│       ├── TextEntry
│       │   ├── TextEntry.tsx
│       │   ├── TextEntryHelper.ts
│       │   ├── TextEntryRule.tsx
│       │   ├── TextEntryRules.tsx
│       │   └── TextEntrySidebar.tsx
│       ├── TextSymbol
│       │   ├── TextSymbol.tsx
│       │   ├── TextSymbolRule.tsx
│       │   ├── TextSymbolRules.tsx
│       │   └── TextSymbolSidebar.tsx
│       ├── TextUpdate
│       │   ├── TextUpdate.tsx
│       │   ├── TextUpdateHelper.ts
│       │   ├── TextUpdateRule.tsx
│       │   ├── TextUpdateRules.tsx
│       │   └── TextUpdateSidebar.tsx
│       ├── Thermometer
│       │   ├── Thermometer.tsx
│       │   ├── ThermometerRule.tsx
│       │   ├── ThermometerRules.tsx
│       │   └── ThermometerSidebar.tsx
│       ├── ThumbWheel
│       │   ├── ThumbWheel.tsx
│       │   ├── ThumbWheelRule.tsx
│       │   ├── ThumbWheelRules.tsx
│       │   └── ThumbWheelSidebar.tsx
│       └── XYPlot
│           ├── XYPlot.tsx
│           ├── XYPlotHelper.ts
│           ├── XYPlotPlot.tsx
│           └── XYPlotSidebar.tsx
└── test
    ├── newFile1.edl
    ├── newFile1.edl~
    ├── profiles.json
    ├── seq_graph.db
    ├── tdmDemo
    │   ├── arithmatic.py
    │   ├── binaryImage.py
    │   ├── demo-01.tdl
    │   ├── demo-02.tdl
    │   ├── demo-03.tdl
    │   ├── demo-04.tdl
    │   ├── letterA_img.png
    │   ├── letterB_img.png
    │   ├── letterC_img.png
    │   ├── letterD_img.png
    │   ├── main.tdl
    │   ├── README.md
    │   ├── sns_logo.png
    │   ├── tdm-demo.db
    │   ├── tdm-demo.tdl
    │   └── traffic.st
    ├── testb1_css.py
    ├── testb1_edm.py
    ├── testb1_tdm.py
    ├── testMainprocess.ts
    ├── testProfile.ts
    ├── testProfiles.ts
    ├── testWebSocket.py
    └── testWebSocket.ts

109 directories, 795 files            
`;

export const TechnicalOverview = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Technical Overview"}>

        <H2 registry={registry}>Techonology choices</H2>

        <P>
            TDM is based on the stack of several web technologies.
            These technologies are widely used in the industry and have been proven to be reliable and efficient.
            The main goal of using these technologies is to provide a cross-platform desktop application that can run on
            Windows, Linux and MacOS.
            The secondary goal is to provide a modern and user-friendly interface for the users.
        </P>



        <P>
            The primary development language for TDM is <LINK link={"https://www.typescriptlang.org/"}>TypeScript</LINK>,
            a superset of JavaScript that adds static type definitions. The user interface is built with
            <LINK link={"https://react.dev/"}>React</LINK>, a widely adopted JavaScript library for building modern webpages.
            The desktop application leverages <LINK link={"https://www.electronjs.org/"}>Electron</LINK>,
            a <LINK link={"https://www.chromium.org/chromium-projects/"}>Chromium</LINK> based architecture to enable cross-platform
            desktop applications.
            As a result, TDM can run on any platform that supports Chromium.
            TDM uses <b><LINK link={"https://indico.fnal.gov/event/58280/contributions/264787/"}>epics-tca</LINK></b> for the EPICS Channel Access and PV Access communication.
            This library is purely based on JavaScript, without the need of third-party library.
            This technology stack ensures cross-platform compatibility, reduces development effort, and provides a consistent
            user experience across different platforms.
        </P>


        <H2 registry={registry}>Build</H2>

        <P>
            TDM supports building and running on all major platforms,
            including Windows, Linux, and macOS.
            The build process is designed to be cross-platform, ensuring a consistent experience regardless of the operating system.
        </P>

        <H3 registry={registry}>Node Package Manager (npm)</H3>

        <P>
            To build TDM from source code, you need to set up the Node development environment first. It is recommended to use <LINK link={"https://www.npmjs.com/"}>npm</LINK>.
            Please following this <LINK link={"https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"}>instruction</LINK> to install Node and npm.
        </P>

        <H3 registry={registry}>TypeScript Compiler (tsc)</H3>
        <P>
            TypeScript compiler (<code>tsc</code>) is required to transpile the TypeScript code to JavaScript.
            We can install it using npm:
        </P>

        <CODE>
            {`
npm install -g typescript
`}
        </CODE>

        <P>
            The <code>-g</code> option means this software is installed to a globally available location. After this step, we should be
            able to run <code>tsc</code> command.
        </P>

        <H3 registry={registry}>Download and compile TDM</H3>

        <P>
            Download the TDM source code:
        </P>

        <CODE>git clone https://github.com/diverhao/tdm.git</CODE>

        <P>
            All the source code are in <code>src</code> folder. Most code are TypeScript files with suffix <code>ts</code> or <code>tsx</code>.
            We should download the dependent libraries to compile TDM. On the top level folder of TDM, run
        </P>

        <CODE>{`npm i\nnpm i -D`}</CODE>

        <P>
            The first command installs the necessary libraries for building and running TDM in development environment.
            The second command is optional, it installs the tools for developing, building and packaging the software.
            All the dependent libraries are installed to the <code>node_modules</code> folder.
        </P>

        <P>
            Next, we transpile the TypeScript code to JavaScript code. On the top level folder of TDM, run
        </P>

        <CODE>
            tsc
        </CODE>

        <P>
            To improve the performance of the software, we bundle more than 400 JavaScript files into one file using <LINK link={"https://webpack.js.org/"}>webpack</LINK>.
        </P>

        <CODE>
            npm run build
        </CODE>

        <P>
            Now we can run TDM:
        </P>

        <CODE>
            npm start
        </CODE>

        <H3 registry={registry}>Packaging</H3>
        <P>
            Electron has the corss compilation capability on various host operating systems.
            We can package TDM to standalone and portable software that run on different platforms from one host.
        </P>

        <P>
            This command generates the MacOS application for different targets:
        </P>

        <CODE>{`npm run build-mac\nnpm run build-windows\nnpm run build-linux`}</CODE>


        <P>
            Or run <code>npm run build-all</code> to build all the above targets.
            You can find the software for different platforms in <code>out</code> folder.
        </P>


        <H2 registry={registry}>Architect</H2>

        <IMG src={"resources/help/architect.png"}></IMG>

        <P>
            TDM is based on Electron to build the desktop application. As shown in the above figure, there is one main process and multiple renderer processes
            in an TDM instance. The main process handles the logic behind the scene: realizes the Channel Access protocol, processes
            data, manages and communicate with renderer processes, reads and writes files, hosts the Local PV server, manage profiles, etc.
            Each renderer process corresponds to a window seen by the user. The renderer process loads an html file and display it in the
            GUI window. The html file contains the elements and JavaScript programs for the users to interface and interact.
        </P>
        <P>
            Each main process or renderer process runs in a separate operating system process. Instead of using the Electron's native inter-process communication (IPC)
            mechanism, a WebSocket-based layer is created to realize the IPC. In this way,
            the TDM can expand its functionalities by adopting the current IPC architect.
        </P>

        <H2 registry={registry}>Source code structure</H2>


        <P>
            The source code is organized into several folders, each folder contains the code for a specific functionality.
            The main process code is in <code>mainProcess</code> folder, while the renderer process code is in <code>rendererProcess</code> folder.
            The <code>test</code> folder contains the test code and data files.
        </P>


        <TREEWRAP
            tree={parseTree(treeStr)}
            sideNote={{
                "/mainProcess": "main process for the backend logic",
                "/mainProcess/archive": "communication with EPICS Archive",
                "/mainProcess/arg": "command line arguments",
                "/mainProcess/channel": "TDM abstraction of CA and PVA protocols, as well as the virtual PV",
                "/mainProcess/channel/CaChannelAgent.ts": "represent a CA or PVA channel",
                "/mainProcess/channel/ChannelAgentsManager.ts": "manage the life cycle of all the channels",
                "/mainProcess/channel/LocalChannelAgent.ts": "virtual channel",
                "/mainProcess/file": "read and parse .dbd, .edl, .tdl files, and local font loader",
                "/mainProcess/global": "methods and variables shared by the main process code",
                "/mainProcess/helpers": "EDM file conversion",
                "/mainProcess/log": "log utility for main process",
                "/mainProcess/mainProcess": "top-level main process code",
                "/mainProcess/mainProcess/MainProcesses.ts": "the main processes",
                "/mainProcess/mainProcess/MainProcess.ts": "each main process",
                "/mainProcess/mainProcess/HttpServer.ts": "HTTPS server for web mode",
                "/mainProcess/mainProcess/ApplicationMenu.ts": "dropdown menu for each display window",
                "/mainProcess/mainProcess/CaSnooperServer.ts": "snoops the CA search packets",
                "/mainProcess/mainProcess/CaswServer.ts": "listens to the server beacons",
                "/mainProcess/mainProcess/IpcManagerOnMainProcess.ts": "handles IPC messages from renderer processes",
                "/mainProcess/mainProcess/IpcManagerOnMainProcesses.ts": "lower level IPC mechanism",
                "/mainProcess/mainProcess/SshClient.ts": "running on client side in SSH mode",
                "/mainProcess/mainProcess/SshServer.ts": "running on server side in SSH mode",
                "/mainProcess/profile": "about the profiles",
                "/mainProcess/profile/Profile.ts": "represents a profile",
                "/mainProcess/profile/Profiles.ts": "all the profiles",
                "/mainProcess/resources": "static resources for the main process",
                "/mainProcess/resources/css": "CSS files and KaTex fonts",
                "/mainProcess/resources/dbd": ".dbd files for record types from EPICS 7 base",
                "/mainProcess/resources/fonts": "fonts shipped with TDM",
                "/mainProcess/resources/help": "pictures and other resources for Help window",
                "/mainProcess/resources/js": "3rd party JavaScript libs that are modified for TDM",
                "/mainProcess/resources/profiles": "TDM profiles file example",
                "/mainProcess/resources/tdls": "tdl file templates",
                "/mainProcess/resources/webpages": "static resources for display windows",
                "/mainProcess/startMainProcess.ts": "access point of TDM",
                "/mainProcess/windows": "renderer process windows representation in main process",
                "/mainProcess/windows/DisplayWindow": "regular display window",
                "/mainProcess/windows/DisplayWindow/BobPropertyConverter.ts": ".bob file converter, not finished yet",
                "/mainProcess/windows/DisplayWindow/ContextMenu.tsx": "right-click context menu in web mode",
                "/mainProcess/windows/DisplayWindow/ContextMenuDesktop.tsx": "right-click context menu in desktop mode",
                "/mainProcess/windows/DisplayWindow/DisplayWindow-web.html": "html file for web mode",
                "/mainProcess/windows/DisplayWindow/DisplayWindow.html": "html file for desktop mode",
                "/mainProcess/windows/DisplayWindow/DisplayWindowAgent.ts": "represents a display window",
                "/mainProcess/windows/DisplayWindow/DisplayWindowClient.tsx": "the access point of JavaScript code in display window",
                "/mainProcess/windows/DisplayWindow/EdlConverter.ts": ".edl file converter",
                "/mainProcess/windows/DisplayWindow/IpcManagerOnDisplayWindow.ts": "handles IPC messages from/to this display window",
                "/mainProcess/windows/DisplayWindow/StpConverter.ts": ".stp file converter",
                "/mainProcess/windows/HelpWindow": "Help window repeatation in main process",
                "/mainProcess/windows/MainWindow": "Main window representation in main process",
                "/mainProcess/windows/UtilityWindow": "Utility window",
                "/mainProcess/windows/WindowAgentsManager.ts": "manages all the renderer process windows",
                "/mainProcess/wsOpener": "handles opening tdl files from another process",
                "/mainProcess/wsPv": "WebSocket-based CA client",
                "/rendererProcess": "renderer process for the frontend GUI",
                "/rendererProcess/channel": "CA/PVA/virtual channels in renderer process",
                "/rendererProcess/channel/DbdFiles.ts": "EPICS dbd files for renderer process",
                "/rendererProcess/channel/Promises.ts": "asynchronous event framework for renderer process",
                "/rendererProcess/channel/ReadWriteIos.ts": "channel read/write I/O event framework",
                "/rendererProcess/channel/TcaChannel.ts": "CA/PVA/virtual channels",
                "/rendererProcess/global": "shared data/methods for each renderer process",
                "/rendererProcess/global/EditorHistories.ts": "histories of text editors",
                "/rendererProcess/global/EditorHistory.ts": "history of text editors",
                "/rendererProcess/global/FontsData.ts": "definitions of fonts used in renderer process",
                "/rendererProcess/global/GlobalMethods.tsx": "shared methods in renderer process",
                "/rendererProcess/global/GlobalVariables.tsx": "shared variables in renderer process",
                "/rendererProcess/global/Widgets.tsx": "manager of all the widgets in a display window",
                "/rendererProcess/helperWidgets": "widgets and components that have special purposes",
                "/rendererProcess/helperWidgets/Canvas": "Canvas of the display window",
                "/rendererProcess/helperWidgets/Canvas/Canvas.tsx": "Canvas of the display window",
                "/rendererProcess/helperWidgets/Canvas/CanvasHelper.ts": "for converting .edl to .tdl",
                "/rendererProcess/helperWidgets/Canvas/CanvasSidebar.tsx": "Canvas sidebar",
                "/rendererProcess/helperWidgets/ColorPicker": "color picker component",
                "/rendererProcess/helperWidgets/EdmSymbol": "TDM component for EDM symbol",
                "/rendererProcess/helperWidgets/ErrorBoundary": "error boundary component wrapping the widget",
                "/rendererProcess/helperWidgets/GroupSelection": "a group of widgets that are being selected",
                "/rendererProcess/helperWidgets/GroupSelection/GroupSelection2.tsx": "data for the group",
                "/rendererProcess/helperWidgets/GroupSelection/GroupSelectionSidebar2.tsx": "sidebar in the display window when multiple widgets are selected",
                "/rendererProcess/helperWidgets/Help": "Help window component and content",
                "/rendererProcess/helperWidgets/Help/content": "Help window content",
                "/rendererProcess/helperWidgets/Help/Elements.tsx": "Help window components",
                "/rendererProcess/helperWidgets/Help/Help.tsx": "access point of Help window",
                "/rendererProcess/helperWidgets/MouseSelectionRegion": "the mouse search region in display window",
                "/rendererProcess/helperWidgets/Prompt": "info/warning/error prompt component in renderer process window",
                "/rendererProcess/helperWidgets/Prompt/Prompt.tsx": "super class for all the prompts",
                "/rendererProcess/helperWidgets/Prompt/PromptOnDisplayWindow.tsx": "components for the prompt in display window",
                "/rendererProcess/helperWidgets/Prompt/PromptOnMainWindow.tsx": "components for the prompt in main window",
                "/rendererProcess/helperWidgets/Root": "the root component of the display window, it wraps the Widgets",
                "/rendererProcess/helperWidgets/RuleComponents": "Rule for various widgets",
                "/rendererProcess/helperWidgets/RuleComponents/RuleAlarmBorder.tsx": "Rule for alarm border of a widget",
                "/rendererProcess/helperWidgets/SharedElements": "shared components in renderer process windows",
                "/rendererProcess/helperWidgets/SharedElements/DropDownMenu.tsx": "drop down menu component",
                "/rendererProcess/helperWidgets/SharedElements/MacrosTable.tsx": "macros table component",
                "/rendererProcess/helperWidgets/SharedElements/RectangleButton.tsx": "rectangle button for OK/Cancel/Confirm",
                "/rendererProcess/helperWidgets/SidebarComponents": "components in the sidebar for each widget in editing mode of display window",
                "/rendererProcess/helperWidgets/SidebarComponents/SidebarActionCloseDisplayWindowItem.tsx": "close display window item in sidebar for Action Button widget",
                "/rendererProcess/helperWidgets/Table": "table component in the display window",
                "/rendererProcess/helperWidgets/VideoRecorder": "video recorder functionality",
                "/rendererProcess/history": "history of user actions when editing the display window",
                "/rendererProcess/keyboard": "shortcut keys for the display window",
                "/rendererProcess/mainWindow": "main window components in renderer process",
                "/rendererProcess/mainWindow/GlobalVariables.ts": "shared data for main window",
                "/rendererProcess/mainWindow/MainWindowProfileEditPage.tsx": "profile editor page in main window",
                "/rendererProcess/mainWindow/MainWindowProfileRunPage.tsx": "main window page after the profile is run",
                "/rendererProcess/mainWindow/MainWindowStartupPage.tsx": "main window page when TDM is started",
                "/rendererProcess/mainWindow/MainWindowStyledComponents.tsx": "shared components for main window",
                "/rendererProcess/widgets": "all widgets in TDM, each folder is a widget",
                "/rendererProcess/widgets/ActionButton": "Action Button widget",
                "/rendererProcess/widgets/ActionButton/ActionButton.tsx": "widget component",
                "/rendererProcess/widgets/ActionButton/ActionButtonHelper.ts": "functions for converting .edl to .tdl",
                "/rendererProcess/widgets/ActionButton/ActionButtonRule.tsx": "each rule for Action Button widget",
                "/rendererProcess/widgets/ActionButton/ActionButtonRules.tsx": "all rules for Action Button widget",
                "/rendererProcess/widgets/ActionButton/ActionButtonSidebar.tsx": "sidebar component of Action Button widget",
                "/test": "for test",
            }}

        ></TREEWRAP>

        <P>
            The main process and renderer process code are cleanly separated. The main process code is written in TypeScript,
            while the renderer process code is written in JSX style TypeScript.
            The renderer process code is transpiled by WebPack to a single JavaScript file to improve the performance.
            The "bridge" between the main process and renderer process is
        </P>
        <CODE>
            mainProcess/windows/DisplayWindow/DisplayWindowClient.tsx
        </CODE>
        <P>

            It is loaded in the html file, which is opened by the main process Electron.js API.
            Meanwhile, it contains all the renderer process code for the display window.
        </P>



        <P>
            Updated August 4, 2025
        </P>

    </ARTICLE >)
};
