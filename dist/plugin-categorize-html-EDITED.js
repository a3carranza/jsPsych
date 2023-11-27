var jsPsychCategorizeHtml = (function (jspsych) {
    'use strict';
  
    const info = {
      name: "categorize-html",
      parameters: {
        stimulus: {
          type: jspsych.ParameterType.HTML_STRING,
          pretty_name: "Stimulus",
          default: undefined,
        },
        key_answer: {
          type: jspsych.ParameterType.HTML_STRING, // Change to HTML_STRING
          pretty_name: "Key answer",
          default: undefined,
        },
        choices: {
          type: jspsych.ParameterType.KEYS,
          pretty_name: "Choices",
          default: "ALL_KEYS",
        },
        text_answer: {
          type: jspsych.ParameterType.HTML_STRING,
          pretty_name: "Text answer",
          default: null,
        },
        correct_text: {
          type: jspsych.ParameterType.HTML_STRING,
          pretty_name: "Correct text",
          default: "<p class='feedback'>Correct</p>",
        },
        incorrect_text: {
          type: jspsych.ParameterType.HTML_STRING,
          pretty_name: "Incorrect text",
          default: "<p class='feedback'>Incorrect</p>",
        },
        prompt: {
          type: jspsych.ParameterType.HTML_STRING,
          pretty_name: "Prompt",
          default: null,
        },
        force_correct_button_press: {
          type: jspsych.ParameterType.BOOL,
          pretty_name: "Force correct button press",
          default: false,
        },
        show_stim_with_feedback: {
          type: jspsych.ParameterType.BOOL,
          default: true,
          no_function: false,
        },
        show_feedback_on_timeout: {
          type: jspsych.ParameterType.BOOL,
          pretty_name: "Show feedback on timeout",
          default: false,
        },
        timeout_message: {
          type: jspsych.ParameterType.HTML_STRING,
          pretty_name: "Timeout message",
          default: "<p>Please respond faster.</p>",
        },
        stimulus_duration: {
          type: jspsych.ParameterType.INT,
          pretty_name: "Stimulus duration",
          default: null,
        },
        trial_duration: {
          type: jspsych.ParameterType.INT,
          pretty_name: "Trial duration",
          default: null,
        },
        feedback_duration: {
          type: jspsych.ParameterType.INT,
          pretty_name: "Feedback duration",
          default: 2000,
        },
      },
    };
  
    class CategorizeHtmlPlugin {
      constructor(jsPsych) {
        this.jsPsych = jsPsych;
      }
  
      trial(display_element, trial) {
        display_element.innerHTML =
          '<div id="jspsych-categorize-html-stimulus" class="jspsych-categorize-html-stimulus">' +
          trial.stimulus +
          "</div>";
  
        // Add an input element for participants to enter their response
        display_element.innerHTML +=
          '<input type="text" id="jspsych-categorize-response" autofocus>';
  
        if (trial.stimulus_duration !== null) {
          this.jsPsych.pluginAPI.setTimeout(() => {
            display_element.querySelector("#jspsych-categorize-html-stimulus").style.visibility = "hidden";
          }, trial.stimulus_duration);
        }
  
        if (trial.prompt !== null) {
          display_element.innerHTML += trial.prompt;
        }
  
        var trial_data = {};
  
        const after_response = (info) => {
          this.jsPsych.pluginAPI.clearAllTimeouts();
          this.jsPsych.pluginAPI.cancelAllKeyboardResponses();
  
          // Get the participant's response from the input element
          var response = display_element.querySelector("#jspsych-categorize-response").value;
  
          // Allow the key response to be an HTML string
          var correct = false;
          if (trial.key_answer.includes(response)) {
            correct = true;
          }
  
          trial_data = {
            rt: info.rt,
            correct: correct,
            stimulus: trial.stimulus,
            response: response,
          };
          display_element.innerHTML = "";
          var timeout = info.rt == null;
          this.doFeedback(correct, timeout, trial, display_element, trial_data);
        };
  
        // Change to listen for Enter key press
        this.jsPsych.pluginAPI.getKeyboardResponse({
          callback_function: after_response,
          valid_responses: [13], // 13 corresponds to the Enter key
          rt_method: "performance",
          persist: false,
          allow_held_key: false,
        });
  
        if (trial.trial_duration !== null) {
          this.jsPsych.pluginAPI.setTimeout(() => {
            after_response({
              key: null,
              rt: null,
            });
          }, trial.trial_duration);
        }
  
        const endTrial = () => {
          display_element.innerHTML = "";
          this.jsPsych.finishTrial(trial_data);
        };
  
        this.doFeedback = (correct, timeout, trial, display_element, trial_data) => {
          if (timeout && !trial.show_feedback_on_timeout) {
            display_element.innerHTML += trial.timeout_message;
          } else {
            if (trial.show_stim_with_feedback) {
              display_element.innerHTML =
                '<div id="jspsych-categorize-html-stimulus" class="jspsych-categorize-html-stimulus">' +
                trial.stimulus +
                "</div>";
            }
  
            var atext = "";
            if (correct) {
              atext = trial.correct_text.replace("%ANS%", trial.text_answer);
            } else {
              atext = trial.incorrect_text.replace("%ANS%", trial.text_answer);
            }
  
            display_element.innerHTML += atext;
          }
  
          if (
            trial.force_correct_button_press &&
            correct === false &&
            ((timeout && trial.show_feedback_on_timeout) || !timeout)
          ) {
            var after_forced_response = (info) => {
              endTrial();
            };
            this.jsPsych.pluginAPI.getKeyboardResponse({
              callback_function: after_forced_response,
              valid_responses: [13], // 13 corresponds to the Enter key
              rt_method: "performance",
              persist: false,
              allow_held_key: false,
            });
          } else {
            this.jsPsych.pluginAPI.setTimeout(endTrial, trial.feedback_duration);
          }
        };
      }
  
      simulate(trial, simulation_mode, simulation_options, load_callback) {
        if (simulation_mode == "data-only") {
          load_callback();
          this.simulate_data_only(trial, simulation_options);
        }
        if (simulation_mode == "visual") {
          this.simulate_visual(trial, simulation_options, load_callback);
        }
      }
  
      create_simulation_data(trial, simulation_options) {
        const key = this.jsPsych.pluginAPI.getValidKey(trial.choices);
        const default_data = {
          stimulus: trial.stimulus,
          response: key,
          rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
          correct: key == trial.key_answer,
        };
        const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
        this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
        return data;
      }
  
      simulate_data_only(trial, simulation_options) {
        const data = this.create_simulation_data(trial, simulation_options);
        this.jsPsych.finishTrial(data);
      }
  
      simulate_visual(trial, simulation_options, load_callback) {
        const data = this.create_simulation_data(trial, simulation_options);
        const display_element = this.jsPsych.getDisplayElement();
        this.trial(display_element, trial);
        load_callback();
        if (data.rt !== null) {
          this.jsPsych.pluginAPI.pressKey(data.response, data.rt);
        }
        if (trial.force_correct_button_press && !data.correct) {
          this.jsPsych.pluginAPI.pressKey(trial.key_answer, data.rt + trial.feedback_duration / 2);
        }
      }
    }
  
    CategorizeHtmlPlugin.info = info;
  
    return CategorizeHtmlPlugin;
  })(jsPsychModule);
