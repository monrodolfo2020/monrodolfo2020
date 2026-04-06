from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Literal, Optional

MEASURED_VARIABLE_MAP = {
    'P': 'Pressure',
    'T': 'Temperature',
    'F': 'Flow',
    'L': 'Level',
    'A': 'Analyzer',
    'D': 'Density/Viscosity',
    'E': 'Voltage/EMF',
    'H': 'Hand/Manual',
    'I': 'Current',
    'J': 'Power',
    'K': 'Time/Schedule',
    'M': 'Moisture',
    'N': 'User Defined',
    'Q': 'Quantity/Totalizer',
    'R': 'Radiation',
    'S': 'Speed/Frequency/Vibration',
    'U': 'Multivariable',
    'V': 'Vibration/Viscosity',
    'W': 'Weight/Force',
    'X': 'Unclassified',
    'Y': 'Event/State',
    'Z': 'Position/Safety',
}


@dataclass
class Instrument:
    tag: str
    line_pipe: Optional[str] = None
    pid_number: Optional[str] = None
    system_title: Optional[str] = None
    measured_variable: Optional[str] = None
    function_letters: Optional[str] = None
    loop_number: Optional[str] = None
    confidence: Literal["high", "medium", "low"] = "high"
    notes: Optional[str] = None
    page_number: int = 1
    source_pdf: str = ""


@dataclass
class ExtractionResult:
    job_id: str
    source_pdf: str
    total_pages: int
    instruments: List[Instrument] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    xlsx_path: Optional[str] = None
