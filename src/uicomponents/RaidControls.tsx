import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from  '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import MoveSelection from "./MoveSelection";
import RaidResults from "./RaidResults";
import MoveDisplay from './MoveDisplay';
import { RaidInputProps } from "../raidcalc/inputs";
import { RaidBattleResults } from "../raidcalc/RaidBattle";


const raidcalcWorker = new Worker(new URL("../workers/raidcalc.worker.ts", import.meta.url));

function RaidControls({raidInputProps, results, setResults, prettyMode}: {raidInputProps: RaidInputProps, results: RaidBattleResults, setResults: (r: RaidBattleResults) => void, prettyMode: boolean}) {
    const [value, setValue] = useState<number>(1);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };  

    useEffect(() => {
        raidcalcWorker.onmessage = (event: MessageEvent<RaidBattleResults>) => {
            if (event && event.data) {
                setResults(event.data);
            }
        }
    }, [raidcalcWorker]);

    useEffect(() => {
        const info = {
            raiders: raidInputProps.pokemon,
            groups: raidInputProps.groups,
        }
        raidcalcWorker
            .postMessage(info);
    }, [raidInputProps.groups, 
        raidInputProps.pokemon[0], 
        raidInputProps.pokemon[1], 
        raidInputProps.pokemon[2], 
        raidInputProps.pokemon[3], 
        raidInputProps.pokemon[4]
      ]
    );

    return (
        <Box width={610} sx={{ mx: 1}}>
            <Box paddingBottom={1}>
                <Tabs value={value} onChange={handleChange} centered>
                    <Tab label="Move Order" value={1} />
                    <Tab label="Calc Results" value={2} />
                </Tabs>
            </Box>
            <Box hidden={value !== 1}>
                <Stack direction="column" spacing={1} >
                    <Box sx={{ height: 560, overflowY: "auto" }}>
                        {!prettyMode &&
                            <MoveSelection raidInputProps={raidInputProps} />
                        }
                        {prettyMode &&
                            <MoveDisplay groups={raidInputProps.groups} raiders={raidInputProps.pokemon} results={results}/>
                        }
                    </Box>
                </Stack>
            </Box>
            <Box hidden={value !== 2} sx={{ height: 560, overflowY: "auto" }}>
                <RaidResults results={results} />
            </Box>
        </Box>
    )
}

export default React.memo(RaidControls);