const fs = require('fs');
const xml2js = require('xml2js');

// Function to validate serviceTask IDs in a BPMN file
function validateBpmnFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const bpmnContent = fs.readFileSync(filePath, 'utf8');
    const parser = new xml2js.Parser();

    parser.parseString(bpmnContent, (err, result) => {
        if (err) {
            console.error(`Error parsing BPMN file ${filePath}:`, err);
            process.exit(1);
        }

        // Try to find the process element, considering namespace variations
        const definitions = result['bpmn:definitions'] || result['definitions'];
        if (!definitions) {
            console.error(`No definitions found in ${filePath}`);
            process.exit(1);
        }

        const process = definitions['bpmn:process'] || definitions['process'];
        if (!process || !Array.isArray(process)) {
            console.error(`No process found in ${filePath}`);
            process.exit(1);
        }

        // Get service tasks from the process
        const serviceTasks = process[0]['bpmn:serviceTask'] || process[0]['serviceTask'] || [];
        if (serviceTasks.length === 0) {
            console.log(`No serviceTask elements found in ${filePath}`);
            return;
        }

        let isValid = true;

        serviceTasks.forEach(task => {
            const taskId = task['$']['id'];
            if (taskId.startsWith('Activity_')) {
                console.error(`Invalid ID found in ${filePath}: ${taskId}`);
                isValid = false;
            }
        });

        if (isValid) {
            console.log(`All serviceTask IDs are valid in ${filePath}`);
        } else {
            process.exit(1); // Exit with an error code if any invalid ID is found
        }
    });
}

// Get file paths from command line arguments
const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
    console.log('No BPMN files to validate.');
    process.exit(0);
}

// Validate each file provided
filePaths.forEach(validateBpmnFile);
