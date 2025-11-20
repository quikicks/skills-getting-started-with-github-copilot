document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and add default option to activity select to avoid duplicates
      activitySelect.innerHTML = '<option value="" disabled selected>Select an activity</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic card content + participants container
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants"><strong>Participants:</strong></div>
        `;

        // Visual styling moved to src/static/styles.css (use .activity-card)

        // Build the participants list (bulleted). If none, show a friendly note.
        const participantsContainer = activityCard.querySelector(".participants");
        // Visual styling for participants moved to src/static/styles.css (use .participants)
         // Announce additions to assistive tech
         participantsContainer.setAttribute("aria-live", "polite");
         participantsContainer.setAttribute("aria-relevant", "additions text");

         const participantsList = document.createElement("ul");
         participantsList.className = "participants-list";
        // Visual/scroll styling moved to src/static/styles.css (use .participants-list)
         participantsList.tabIndex = 0;
         participantsList.setAttribute("aria-label", `${name} participants`);
         participantsList.setAttribute("role", "list");

         if (Array.isArray(details.participants) && details.participants.length > 0) {
           details.participants.forEach((p) => {
             const li = document.createElement("li");
             li.className = "participant";
             li.setAttribute("role", "listitem");

             // Participant name span
             const nameSpan = document.createElement("span");
             nameSpan.textContent = p;
             li.appendChild(nameSpan);

             // Delete icon
             const deleteIcon = document.createElement("span");
             deleteIcon.className = "delete-icon";
             deleteIcon.title = "Unregister participant";
             deleteIcon.innerHTML = "&#128465;"; // Unicode trash can
             deleteIcon.addEventListener("click", async (e) => {
               e.stopPropagation();
               // Unregister API call
               try {
                 const response = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
                   method: "POST"
                 });
                 if (response.ok) {
                   // Remove participant from UI
                   li.remove();
                 } else {
                   const result = await response.json();
                   alert(result.detail || "Failed to unregister participant.");
                 }
               } catch (err) {
                 alert("Error unregistering participant.");
               }
             });
             li.appendChild(deleteIcon);

             participantsList.appendChild(li);
           });
           participantsContainer.appendChild(participantsList);
         } else {
           const none = document.createElement("div");
           none.className = "no-participants";
           none.textContent = "No participants yet.";
          // Visual styling for empty state moved to src/static/styles.css (use .no-participants)
           participantsContainer.appendChild(none);
         }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so UI updates immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
