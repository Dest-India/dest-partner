import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export const isUserExist = async (email) => {
  const { data, error } = await supabaseAdmin
    .from("partners")
    .select("id")
    .eq("email", email)
    .eq("disabled", false);

  if (error) {
    console.error("Error checking user:", error);
    throw error;
  }
  return data && data.length > 0;
};

export const createUser = async (userData) => {
  const { data, error } = await supabaseAdmin
    .from("partners")
    .insert(userData)
    .select();

  if (error) {
    console.error("Error creating user:", error);
    throw error;
  }
  return data[0];
};

export const getUserByEmail = async (email) => {
  const { data, error } = await supabaseAdmin
    .from("partners")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user by email:", error);
    throw error;
  }

  return data;
};

export const updateUserData = async (id, userData) => {
  const { data, error } = await supabaseAdmin
    .from("partners")
    .update({ ...userData, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating user data:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error("Something went wrong.");
  }
  return data[0];
};

export const getAccounts = async () => {
  const { data, error } = await supabaseAdmin
    .from("partners")
    .select("*")
    .eq("verified", false);

  if (error) {
    if (error.code === "PGRST116") {
      return { success: 404, message: "user does not exist" };
    }
    console.error("Error fetching user by email:", error);
    throw error;
  }

  return { success: true, data: data };
};

export const accessAccount = async (email) => {
  const { data, error } = await supabaseAdmin
    .from("partners")
    .update({ verified: true, updated_at: new Date() })
    .eq("email", email)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: 404, message: "user does not exist" };
    }
    console.error("Error fetching user by email:", error);
    throw error;
  }

  return { success: true, data: data };
};

// get dashboard metrics
export const getDashboardMetrics = async (partnerId) => {
  // get count of coaches, courses,  students, turfs, turf_bookings
  const { data, error } = await supabaseAdmin
    .from("partners")
    .select(
      `tutors(count),
    courses(count),
    enrollments(count),
    turfs(count),
    turf_bookings(count)
  `
    )
    .eq("id", partnerId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: 404, message: "data does not exist" };
    }
    console.error("Error fetching data:", error);
    throw error;
  }

  return data;
};

// Tutors
export const getTutors = async (partnerId) => {
  const { data, error } = await supabaseAdmin
    .from("tutors")
    .select("*")
    .eq("partner_id", partnerId);

  if (error) {
    console.error("Error fetching tutors:", error);
    throw error;
  }
  return data;
};

export const addTutor = async (tutorData) => {
  const { data, error } = await supabaseAdmin
    .from("tutors")
    .insert(tutorData)
    .select();

  if (error) {
    console.error("Error adding tutor:", error);
    throw error;
  }
  return data[0];
};

export const updateTutor = async (id, tutorData) => {
  const { data, error } = await supabaseAdmin
    .from("tutors")
    .update({ ...tutorData, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating tutor:", error);
    throw error;
  }
  return data[0];
};

export const deleteTutor = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("tutors")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deleting tutor:", error);
    throw error;
  }
  return data[0];
};

// Courses
export const getCourses = async (partnerId) => {
  let query = supabaseAdmin
    .from("courses")
    .select(
      `
      *,
      batches:batches(count)
    `
    )
    .eq("partner_id", partnerId);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching courses:", error);
    throw error;
  }

  const simplifiedData = data.map((course) => ({
    ...course,
    batches: course.batches.length > 0 ? course.batches[0].count : 0,
  }));

  return simplifiedData;
};

// Programs (alias for courses for compatibility)
export const getPrograms = async (partnerId) => {
  return getCourses(partnerId);
};

export const getCourseById = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(
      `*, batches:batches(*, plans:batch_plans(*, students:enrollments(count)))`
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: 404, message: "Course does not exist" };
    }
    console.error("Error fetching course:", error);
    throw error;
  }

  return data;
};

export const addCourse = async (courseData) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .insert(courseData)
    .select();

  if (error) {
    console.error("Error adding course:", error);
    throw error;
  }

  return data[0];
};

export const updateCourse = async (id, courseData) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .update({ ...courseData, updated_at: new Date() })
    .eq("id", id)
    .select();
  if (error) {
    console.error("Error updating course:", error);
    throw error;
  }
  return data[0];
};

export const deactiveCourse = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .update({ active: false, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deactivating course:", error);
    throw error;
  }

  return data[0];
};

export const getCoursesWithPlans = async (partnerId) => {
  const { data, error } = await supabaseAdmin
    .from("courses")
    .select(
      `
      *,
      batches:batches(
        *,
        plans:batch_plans(count)
      )
    `
    )
    .eq("partner_id", partnerId)
    .eq("active", true);

  if (error) {
    console.error("Error fetching courses with plans:", error);
    throw error;
  }

  // Filter courses that have at least one batch with at least one plan
  const filteredCourses = data.filter(
    (course) =>
      course.batches &&
      course.batches.some(
        (batch) =>
          batch.plans && batch.plans.length > 0 && batch.plans[0].count > 0
      )
  );

  // Simplify the data structure
  const simplifiedData = filteredCourses.map((course) => ({
    ...course,
    batches: course.batches.filter(
      (batch) =>
        batch.plans && batch.plans.length > 0 && batch.plans[0].count > 0
    ).length,
  }));

  return simplifiedData;
};

export const getBatchesWithPlans = async (courseId) => {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .select(
      `
      *,
      plans:batch_plans(count)
    `
    )
    .eq("course_id", courseId)
    .eq("active", true);

  if (error) {
    console.error("Error fetching batches with plans:", error);
    throw error;
  }

  // Filter batches that have at least one plan
  const filteredBatches = data.filter(
    (batch) => batch.plans && batch.plans.length > 0 && batch.plans[0].count > 0
  );

  return filteredBatches;
};

// Batches
export const addBatch = async (batchData) => {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .insert(batchData)
    .select();

  if (error) {
    console.error("Error adding batch:", error);
    throw error;
  }
  return data[0];
};

export const updateBatch = async (id, batchData) => {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .update({ ...batchData, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating batch:", error);
    throw error;
  }
  return data[0];
};

export const deactivateBatch = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .update({ active: false, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deactivating batch:", error);
    throw error;
  }

  return data[0];
};

export const getBatchesByCourse = async (courseId) => {
  const { data, error } = await supabaseAdmin
    .from("batches")
    .select("*")
    .eq("course_id", courseId)
    .eq("active", true);

  if (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }

  return data;
};

export const getPlansByBatch = async (batchId) => {
  const { data, error } = await supabaseAdmin
    .from("batch_plans")
    .select("*")
    .eq("batch_id", batchId)
    .eq("active", true);

  if (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }

  return data;
};

// Plans
export const addBatchPlan = async (planData) => {
  const { data, error } = await supabaseAdmin
    .from("batch_plans")
    .insert(planData)
    .select();

  if (error) {
    console.error("Error adding plan:", error);
    throw error;
  }
  return data[0];
};

export const updateBatchPlan = async (id, planData) => {
  const { data, error } = await supabaseAdmin
    .from("batch_plans")
    .update({ ...planData, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating plan:", error);
    throw error;
  }
  return data[0];
};

export const deactivateBatchPlan = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("batch_plans")
    .update({ active: false, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deactivating plan:", error);
    throw error;
  }

  return data[0];
};

export const addEnrollment = async (enrollmentData) => {
  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .insert(enrollmentData)
    .select();

  if (error) {
    console.error("Error adding enrollment:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw error;
  }
  return data[0];
};

export const getEnrollments = async (partnerId) => {
  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .select(
      `*, user:users(*), plan:batch_plans(*, batch:batches(*, course:courses(*)))`
    )
    .eq("partner_id", partnerId);

  if (error) {
    console.error("Error fetching enrollments:", error);
    throw error;
  }

  return data;
};

export const createStudentMember = async (userData) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert(userData)
    .select();

  if (error) {
    console.error("Error creating user:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw error;
  }
  return data[0];
};

export const getTurfs = async (partnerId) => {
  const { data, error } = await supabaseAdmin
    .from("turfs")
    .select("*, courts:turf_courts(*)")
    .eq("partner_id", partnerId);

  if (error) {
    console.error("Error fetching turfs:", error);
    throw error;
  }

  return data;
};

export const addTurf = async (turfData) => {
  const { data, error } = await supabaseAdmin
    .from("turfs")
    .insert(turfData)
    .select();

  if (error) {
    console.error("Error adding turf:", error);
    throw error;
  }

  return data[0];
};

export const updateTurf = async (id, turfData) => {
  const { data, error } = await supabaseAdmin
    .from("turfs")
    .update(turfData)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating turf:", error);
    throw new Error("Something went wrong.");
  }

  if (!data || data.length === 0) {
    throw new Error("Something went wrong.");
  }

  return data[0];
};

export const deactiveTurf = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("turfs")
    .update({ active: false, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error deactivating turf:", error);
    throw new Error("Something went wrong.");
  }

  if (!data || data.length === 0) {
    throw new Error("Something went wrong.");
  }

  return data[0];
};

export const activeTurf = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("turfs")
    .update({ active: true, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error activating turf:", error);
    throw new Error("Something went wrong.");
  }

  if (!data || data.length === 0) {
    throw new Error("Something went wrong.");
  }
  return data[0];
};

export const getCourt = async (id) => {
  const { data, error } = await supabaseAdmin
    .from("turf_courts")
    .select("*, turf:turfs(*)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: 404, message: "Court does not exist" };
    }
    console.error("Error fetching court:", error);
    throw error;
  }

  return data;
};

export const addCourt = async (courtData) => {
  const { data, error } = await supabaseAdmin
    .from("turf_courts")
    .insert(courtData)
    .select();

  if (error) {
    console.error("Error adding court:", error);
    throw error;
  }

  return data[0];
};

export const updateCourt = async (id, courtData) => {
  const { data, error } = await supabaseAdmin
    .from("turf_courts")
    .update({ ...courtData, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating court:", error);
    throw error;
  }
  return data[0];
};

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const addWeeklyAvailability = async (courtId) => {
  const availability = [];

  for (const day_of_week of days) {
    const { data: slotData, error: slotError } = await supabaseAdmin
      .from("court_weekly_availability")
      .insert({
        court_id: courtId,
        day_of_week,
        slots: [],
      })
      .select();

    if (slotError) {
      console.error(`Error adding time slots for ${day_of_week}:`, slotError);
      throw slotError;
    }

    if (slotData && Array.isArray(slotData)) {
      availability.push(...slotData);
    }
  }

  return availability;
};

export const getWeeklyAvailability = async (courtId) => {
  const { data, error } = await supabaseAdmin
    .from("court_weekly_availability")
    .select("*")
    .eq("court_id", courtId)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Error fetching weekly availability:", error);
    throw error;
  }

  return data;
};

export const updateWeeklyAvailability = async (dayDataArray) => {
  const results = [];

  for (const dayData of dayDataArray) {
    try {
      if (dayData.id) {
        // Update existing record
        const { data, error } = await supabaseAdmin
          .from("court_weekly_availability")
          .update({
            slots: dayData.slots,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dayData.id)
          .select();

        if (error) {
          console.error(
            `Error updating availability for ${dayData.day_of_week}:`,
            error
          );
          throw error;
        }
        results.push(data[0]);
      } else {
        // Insert new record
        const { data, error } = await supabaseAdmin
          .from("court_weekly_availability")
          .insert({
            court_id: dayData.court_id,
            day_of_week: dayData.day_of_week,
            slots: dayData.slots,
          })
          .select();

        if (error) {
          console.error(
            `Error inserting availability for ${dayData.day_of_week}:`,
            error
          );
          throw error;
        }
        results.push(data[0]);
      }
    } catch (error) {
      console.error(`Error processing ${dayData.day_of_week}:`, error);
      throw error;
    }
  }

  return results;
};

export const getAvailabilityOverrides = async (courtId) => {
  const { data, error } = await supabaseAdmin
    .from("availability_override")
    .select("*")
    .eq("court_id", courtId)
    .order("date", { ascending: true });

  if (error) {
    if (error.code === "PGRST116") {
      return { success: 404, message: "No availability overrides found" };
    }
    console.error("Error fetching availability overrides:", error);
    throw error;
  }

  return data;
};

export const addAvailabilityOverride = async (overrideData) => {
  const { data, error } = await supabaseAdmin
    .from("availability_override")
    .insert(overrideData)
    .select();

  if (error) {
    console.error("Error adding availability override:", error);
    throw error;
  }

  return data[0];
};

export const updateAvailabilityOverride = async (id, overrideData) => {
  const { data, error } = await supabaseAdmin
    .from("availability_override")
    .update({ ...overrideData, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating availability override:", error);
    throw error;
  }

  return data[0];
};

export const getTurfBookings = async (partnerId) => {
  const { data, error } = await supabaseAdmin
    .from("turf_bookings")
    .select("*, user:users(*), court:turf_courts(*, turf:turfs(*))")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST116") {
      return { success: 404, message: "No availability overrides found" };
    }
    console.error("Error fetching turf bookings:", error);
    throw error;
  }

  return data;
};

export const declineTurfBooking = async (id, reason) => {
  // First, get the booking details with user information
  const { data: booking, error: fetchError } = await supabaseAdmin
    .from("turf_bookings")
    .select(
      `
      *,
      user:users(id, name, email),
      court:turf_courts(name, sport, turf:turfs(name))
    `
    )
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Error fetching booking details:", fetchError);
    throw fetchError;
  }

  // Update the booking to declined
  const { data, error } = await supabaseAdmin
    .from("turf_bookings")
    .update({ declined: true, decline_reason: reason, updated_at: new Date() })
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error declining turf booking:", error);
    throw error;
  }

  // Send email notification to the user
  if (booking?.user?.email) {
    try {
      await fetch("/api/sendDeclineEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: booking.user.email,
          userName: booking.user.name,
          courtName: booking.court?.name,
          turfName: booking.court?.turf?.name,
          sport: booking.court?.sport,
          date: booking.date,
          startTime: booking.start_time,
          endTime: booking.end_time,
          reason: reason,
        }),
      });
    } catch (emailError) {
      console.error("Error sending decline email:", emailError);
      // Don't throw here - booking is already declined
    }
  }

  return data[0];
};

// support requests
export const requestForSupport = async (requestData) => {
  const { data, error } = await supabaseAdmin
    .from("support_requests")
    .insert(requestData)
    .select();

  if (error) {
    console.error("Error creating support request:", error);
    throw error;
  }

  return data[0];
};

export const getSupportRequests = async (partnerId) => {
  const { data, error } = await supabaseAdmin
    .from("support_requests")
    .select("*")
    .eq("customer_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching support requests:", error);
    throw error;
  }

  return data;
};

// payments
export const getPartnerPayment = async (partnerId) => {
  const { data, error } = await supabaseAdmin
    .from("partner_payments")
    .select("*")
    .eq("partner_id", partnerId)
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching partner payment:", error);
    throw error;
  }

  return data;
};

export const createPartnerPayment = async (paymentData) => {
  const { data, error } = await supabaseAdmin
    .from("partner_payments")
    .insert(paymentData)
    .select()
    .single();

  if (error) {
    console.error("Error creating partner payment:", error);
    throw error;
  }

  return data;
};

export const updatePartnerPayment = async (orderId, paymentData) => {
  const { data, error } = await supabaseAdmin
    .from("partner_payments")
    .update({ ...paymentData, updated_at: new Date() })
    .eq("razorpay_order_id", orderId)
    .select()
    .single();

  if (error) {
    console.error("Error updating partner payment:", error);
    throw error;
  }

  return data;
};
