import { DetailsList, DetailsListLayoutMode, DetailsRow, IColumn, IDetailsRowProps, IDetailsRowStyles, ITextFieldStyleProps, ITextFieldStyles, Link, SelectionMode, TextField } from "@fluentui/react";
import { Entry, HarFile } from "../../sanitizer/models/harFile";
import { Text } from '@fluentui/react';
import { convertBatchEntryToEntries as convertBatchRequestsToEntries } from "../../common/batchConverter";
import { getTheme } from '@fluentui/react/lib/Styling';
import { useState } from "react";
import { RequestPanel } from "./RequestPanel";

export interface TraceInspectorProps {
    fileContent: HarFile
}

export interface InspectorEntry extends Entry {
    isBatchChildEntry: boolean;
}

const theme = getTheme();

const getSearchBoxStyles = (props: ITextFieldStyleProps): Partial<ITextFieldStyles> => {
    return {
      fieldGroup: [
        { 
            width: '400px',
            height: '25px',
            marginTop: '10px',
            marginLeft: '10px'
        }
      ],
  }
}

export const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 400 && statusCode < 500) {
        return theme.palette.orange;
    } else if(statusCode >= 500){
        return theme.palette.redDark;
    }

    return theme.palette.black;
}

const getRequestStyle = (statusCode: number): React.CSSProperties =>{
    return { color: getStatusCodeColor(statusCode) };

}

export function TraceInspector(props: TraceInspectorProps) {
    const fileContent = props.fileContent;
    const [selectedEntry, setSelectedEntry] = useState<InspectorEntry | null>(null);
    const [searchText, setSearchText] = useState<string>('');

    const entries: InspectorEntry[] = [];
    for (const entry of fileContent.log.entries) {
        if(!searchText || entry.request.url.toLowerCase().indexOf(searchText.toLowerCase()) > -1){
            entries.push({
                ...entry,
                isBatchChildEntry: false
            });    
        }

        convertBatchRequestsToEntries(entry, entries, searchText);
    }

    const onRenderMethodCol = (item?: InspectorEntry, index?: number, column?: IColumn) => {
        if (item) {
            return <Text style={getRequestStyle(item.response.status)}>{item.request.method}</Text>
        }
    };

    const onRenderUrlCol = (item?: InspectorEntry, index?: number, column?: IColumn) => {
        if (item) {
            if (item.isBatchChildEntry) {
                const parsedUrl = new URL(item.request.url);
                const url = item.request.url.split(parsedUrl.origin)[1];   // remove the 'https://<hostname>' prefix
            
                return <Link onClick={() =>{ setSelectedEntry(item)}} style={getRequestStyle(item.response.status)}>&nbsp;&nbsp;&nbsp;&nbsp;- {url}</Link>
            }

            return <Link onClick={() =>{ setSelectedEntry(item)}} style={getRequestStyle(item.response.status)}>{item.request.url}</Link>
        }
    };

    const onRenderStatus = (item?: InspectorEntry, index?: number, column?: IColumn) => {
        if (item) {
            return <Text style={getRequestStyle(item.response.status)}>{item.response.status}</Text>
        }
    };

    const onRenderDuration = (item?: InspectorEntry, index?: number, column?: IColumn) => {
        if (item) {
            return <Text style={getRequestStyle(item.response.status)}>{Math.round(item.time)}</Text>
        }
    };

    const onRenderRow = (props: IDetailsRowProps | undefined) => {
        const customStyles: Partial<IDetailsRowStyles> = {};
        if (props) {
            if (props.itemIndex % 2 === 0) {
                customStyles.root = { backgroundColor: theme.palette.themeLighterAlt };
            }

            return <DetailsRow {...props} styles={customStyles} />;
        }
        return null;
    }

    const dismissPanel = () =>{
        setSelectedEntry(null);
    }

    const columns: IColumn[] = [{
        key: 'method',
        name: 'Method',
        onRender: onRenderMethodCol,
        minWidth: 60
    },
    {
        key: 'url',
        name: 'URL',
        onRender: onRenderUrlCol,
        minWidth: 500,
        maxWidth: 700,
        isResizable: true
    },
    {
        key: 'status',
        name: 'Status',
        onRender: onRenderStatus,
        minWidth: 50,
        isResizable: false
    },
    {
        key: 'duration',
        name: 'Duration',
        onRender: onRenderDuration,
        minWidth: 70,
        isResizable: false
    }];

    const onSearch = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) =>{
        setSearchText(newValue ? newValue : '');
    }

    return <>
        <TextField placeholder='Search by URL' styles={getSearchBoxStyles} onChange={onSearch}></TextField>
        <DetailsList
            items={entries}
            columns={columns}
            setKey="set"
            compact={true}
            layoutMode={DetailsListLayoutMode.fixedColumns}
            selectionMode={SelectionMode.none}
            onRenderRow={onRenderRow}
            ariaLabelForSelectionColumn="Toggle selection"
            ariaLabelForSelectAllCheckbox="Toggle selection for all items"
            checkButtonAriaLabel="select row"
        />
        <RequestPanel entry={selectedEntry} dismissPanel={dismissPanel}></RequestPanel>
    </>
}
