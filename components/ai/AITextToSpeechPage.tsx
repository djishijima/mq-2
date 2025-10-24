import React, { useState } from 'react';
import { Loader, Sparkles } from '../Icons';
import * as geminiService from '../../services/geminiService';
import * as dataService from '../../services/dataService'; // FIX: Imported dataService
import { Toast, EmployeeUser } from '../../types';
import { decode, decodeAudioData