-- Blue Shift: self-contained single-seat body; driving remains owned by KartFactory.
local Body = {}
local V, C, A = Vector3.new, CFrame.new, CFrame.Angles
local blue = Color3.fromRGB(12, 119, 224)
local sky = Color3.fromRGB(35, 165, 250)
local dark = Color3.fromRGB(13, 20, 31)
local carbon = Color3.fromRGB(28, 36, 47)
local silver = Color3.fromRGB(149, 169, 185)
local cyan = Color3.fromRGB(162, 241, 255)
local function motor(name, base, part, pivot)
    local m=Instance.new("Motor6D")
    m.Name=name;m.Part0=base;m.Part1=part
    m.C0=base.CFrame:ToObjectSpace(pivot)
    m.C1=part.CFrame:ToObjectSpace(pivot);m.Parent=base
    return m
end
function Body.Build(model, root, shell, seat)
    assert(not model:FindFirstChild("RoadsterBody"), "Roadster already built")
    -- Retain the existing collision contacts, seat, body joint and wheel joints.
    for _,p in ipairs(model:GetDescendants()) do
        if p:IsA("BasePart") and p~=seat then p.Transparency=1 end
    end
    local folder=Instance.new("Model");folder.Name="RoadsterBody";folder.Parent=model
    local function part(name,size,cf,color,shape,mount,free)
        local p=Instance.new(shape=="Wedge" and "WedgePart" or "Part")
        p.Name=name;p.Size=size;p.CFrame=root.CFrame*cf;p.Color=color or blue
        p.Material=Enum.Material.SmoothPlastic;p.CanCollide=false;p.CanTouch=false;p.CanQuery=false
        p.Massless=true;p.TopSurface=Enum.SurfaceType.Smooth;p.BottomSurface=Enum.SurfaceType.Smooth
        if shape=="Ball" then p.Shape=Enum.PartType.Ball end
        if shape=="Cylinder" then p.Shape=Enum.PartType.Cylinder end
        p.Parent=folder
        if not free then local w=Instance.new("WeldConstraint");w.Part0=mount or shell;w.Part1=p;w.Parent=p end
        return p
    end
    local function strip(name,a,b,width,color,mount)
        local p=part(name,V(width,width,(b-a).Magnitude),CFrame.lookAt((a+b)*.5,b),color,nil,mount)
        p.Material=Enum.Material.Neon;return p
    end
    part("CarbonUndertray",V(4.9,.22,7.15),C(0,-.38,0),carbon)
    part("LowerHull",V(4.8,.65,6.9),C(0,-.02,0),blue)
    part("FrontSplitter",V(5.55,.13,.55),C(0,-.36,-3.65),dark)
    part("NoseRounded",V(5.18,1.0,1.7),C(0,.08,-2.95),blue,"Ball")
    part("SculptedHood",V(3.7,.85,2.65),C(0,.39,-2.04),blue,"Wedge")
    part("HoodSpine",V(.09,.028,2.2),C(0,.82,-1.98)*A(math.rad(-17),0,0),sky)
    for _,s in ipairs({-1,1}) do
        local x=s*2.02
        part("Shoulder",V(1.05,.76,5.2),C(x,.37,.1),blue,"Ball")
        part("SideSill",V(.48,.42,5.85),C(s*2.48,-.12,0),blue)
        part("SillBlade",V(.55,.1,3.25),C(s*2.52,-.36,.05),dark)
        part("DoorSkin",V(.25,.83,2.62),C(s*2.37,.54,.18)*A(0,0,s*math.rad(7)),blue)
        part("SideAirIntake",V(.27,.5,.85),C(s*2.51,.39,1.35)*A(0,s*math.rad(15),0),dark)
        for j=1,3 do part("IntakeVane",V(.30,.055,.69),C(s*2.52,.2+j*.12,1.35),carbon) end
        part("FrontIntake",V(1.3,.33,.2),C(s*1.7,-.04,-3.68),dark)
        strip("Daylight",V(s*1.28,.50,-3.57),V(s*2.17,.61,-3.19),.105,cyan)
        strip("DaylightReturn",V(s*2.17,.61,-3.19),V(s*2.28,.76,-2.77),.075,cyan)
        part("MirrorArm",V(.46,.09,.1),C(s*2.58,1.05,-.7),dark)
        part("Mirror",V(.52,.23,.30),C(s*2.86,1.09,-.7),blue,"Ball")
        -- Segmented arches hug each rotating wheel instead of covering the tire.
        for _,z in ipairs({-2.1,2.1}) do
            for j=0,11 do
                local a=math.pi*(j+.5)/12
                part("WheelArch",V(.47,.22,.39),C(s*2.6,-.25+1.19*math.sin(a),z+1.19*math.cos(a))*A(a,0,0),blue)
            end
        end
    end
    -- A central cockpit, not a two-seat body with an unused passenger seat.
    seat.Color=dark;seat.Transparency=0
    part("CockpitWell",V(2.6,.15,2.85),C(0,.37,.15),dark)
    part("BucketBack",V(1.7,1.5,.32),C(0,1.15,1.39)*A(math.rad(9),0,0),dark)
    part("Headrest",V(1.02,.52,.38),C(0,2.04,1.51),dark,"Ball")
    for _,s in ipairs({-1,1}) do
        part("BucketBolster",V(.24,.54,1.8),C(s*.87,.87,.48),carbon,"Ball")
        part("Harness",V(.11,1.26,.035),C(s*.36,1.25,1.19)*A(math.rad(9),0,0),sky)
        part("RearFairing",V(1.35,.92,1.6),C(s*1.77,.81,1.84),blue,"Ball")
        part("WindshieldPillar",V(.10,1.0,.12),C(s*1.23,1.22,-.82)*A(math.rad(25),0,0),dark)
        strip("RollBar",V(s*.94,1.15,1.69),V(s*.94,2.19,1.69),.15,carbon)
    end
    part("RollHoop",V(1.97,.16,.16),C(0,2.2,1.69),carbon)
    local glass=part("WraparoundWindshield",V(2.42,.94,.055),C(0,1.19,-.82)*A(math.rad(25),0,0),Color3.fromRGB(47,86,108))
    glass.Material=Enum.Material.Glass;glass.Transparency=.38;glass.Reflectance=.12
    part("Dash",V(2.45,.38,.46),C(0,.78,-.65),dark)
    part("InstrumentScreen",V(.64,.23,.03),C(0,1.00,-.42)*A(math.rad(-12),0,0),cyan).Material=Enum.Material.Neon
    for j=0,11 do local a=j*math.pi/6
        part("SteeringRim",V(.11,.11,.24),C(.43*math.cos(a),1.04+.34*math.sin(a),-.05)*A(0,math.pi/2,a),dark)
    end
    part("SteeringHub",V(.45,.10,.1),C(0,1.04,-.05),silver)
    -- Five-spoke wheels use the original animated wheel motors.
    for _,s in ipairs({-1,1}) do for _,z in ipairs({-2.1,2.1}) do
        local id=(z<0 and "F" or "R")..(s<0 and "L" or "R")
        local tire=model:FindFirstChild("Tire_"..id)
        if tire then
            part("PerformanceTire_"..id,V(.88,2.03,2.03),C(s*2.65,-.25,z),dark,"Cylinder",tire)
            part("RimBarrel",V(.92,1.57,1.57),C(s*2.65,-.25,z),silver,"Cylinder",tire)
            part("RimInset",V(.94,1.31,1.31),C(s*2.65,-.25,z),carbon,"Cylinder",tire)
            part("BrakeDisc",V(.95,.94,.94),C(s*2.65,-.25,z),Color3.fromRGB(76,89,103),"Cylinder",tire)
            for j=0,4 do local a=j*math.pi*2/5
                part("ForgedSpoke",V(.97,.14,1.35),C(s*2.65,-.25,z)*A(a,0,0),silver,nil,tire)
            end
            part("CenterLock",V(.99,.30,.30),C(s*2.65,-.25,z),blue,"Cylinder",tire)
        end
    end end
    part("RearBumper",V(5.22,.70,.47),C(0,.02,3.4),blue)
    part("RearDiffuser",V(4.48,.36,.47),C(0,-.30,3.62),dark)
    for j=-2,2 do part("DiffuserFin",V(.085,.3,.60),C(j*.7,-.28,3.6),carbon) end
    strip("RearLightBar",V(-2.25,.54,3.66),V(2.25,.54,3.66),.12,Color3.fromRGB(255,42,55))
    for _,s in ipairs({-1,1}) do
        strip("RearLightHook",V(s*2.25,.54,3.66),V(s*2.42,.64,3.23),.12,Color3.fromRGB(255,42,55))
    end
    part("EngineBay",V(3.4,.38,1.95),C(0,.61,2.62),dark)
    local rig=Instance.new("Folder");rig.Name="BoosterRig";rig.Parent=folder
    -- Two outer-hinged covers conceal the engine and rise like the reference.
    for _,s in ipairs({-1,1}) do
        local cover=part(s<0 and "CoverLeft" or "CoverRight",V(1.54,.18,1.98),C(s*.80,1.03,2.64),blue,nil,nil,true)
        local m=motor(s<0 and "DoorLeft" or "DoorRight",shell,cover,root.CFrame*C(s*1.58,1.03,2.64))
        m.Parent=rig
        for j=1,3 do part("CoverVent",V(.72,.035,.055),C(s*.80,1.135,2.2+j*.23),dark,nil,cover) end
    end
    local carriage=part("TurbineCarriage",V(2.82,.35,1.25),C(0,.36,2.61),silver,nil,nil,true)
    motor("TurbineLift",shell,carriage,carriage.CFrame).Parent=rig
    for _,s in ipairs({-1,1}) do
        local housing=part("TurbineHousing",V(1.37,1.04,1.04),C(s*.78,.59,2.69)*A(0,math.pi/2,0),silver,"Cylinder",carriage)
        part("TurbineBand",V(.24,1.13,1.13),C(s*.78,.59,2.9)*A(0,math.pi/2,0),carbon,"Cylinder",carriage)
        part("TurbineMouth",V(.11,.86,.86),C(s*.78,.59,3.39)*A(0,math.pi/2,0),dark,"Cylinder",carriage)
        for j=0,7 do local a=j*math.pi/4
            part("NozzlePetal",V(.10,.17,.44),C(s*.78+.47*math.cos(a),.59+.47*math.sin(a),3.37)*A(0,0,a),carbon,nil,carriage)
        end
        part("MiniExhaustRim",V(.25,.43,.43),C(s*1.54,-.07,3.73)*A(0,math.pi/2,0),silver,"Cylinder")
        part("MiniExhaustMouth",V(.27,.29,.29),C(s*1.54,-.07,3.76)*A(0,math.pi/2,0),dark,"Cylinder")
    end
    local spoiler=part("ActiveRearWing",V(4.95,.15,.60),C(0,1.03,3.62),blue,nil,nil,true)
    motor("WingLift",shell,spoiler,spoiler.CFrame).Parent=rig
    local function exhaust(label,mount,position,length,width)
        local a=Instance.new("Attachment");a.Name=label.."Origin";a.Position=position;a.Parent=mount
        local b=Instance.new("Attachment");b.Name=label.."Tip";b.Position=position+V(0,0,length);b.Parent=mount
        for layer=1,2 do
            local beam=Instance.new("Beam");beam.Name=label..(layer==1 and "Outer" or "Core")
            beam.Attachment0=a;beam.Attachment1=b;beam.FaceCamera=true;beam.Segments=10
            beam.Width0=width*(layer==1 and 1 or .37);beam.Width1=.025
            beam.Color=ColorSequence.new(layer==1 and Color3.fromRGB(24,149,255) or cyan)
            beam.Transparency=NumberSequence.new({NumberSequenceKeypoint.new(0,.05),NumberSequenceKeypoint.new(.55,.2),NumberSequenceKeypoint.new(1,1)})
            beam.LightEmission=1;beam.LightInfluence=0;beam.Enabled=false;beam.Parent=a
        end
        local e=Instance.new("ParticleEmitter");e.Name=label.."Fire";e.Texture="rbxasset://textures/particles/fire_main.dds"
        e.Color=ColorSequence.new(cyan,Color3.fromRGB(30,132,255));e.Size=NumberSequence.new(width*.6,0)
        e.Transparency=NumberSequence.new(.15,1);e.Lifetime=NumberRange.new(.08,.16);e.Speed=NumberRange.new(length*4,length*6)
        e.Rate=35;e.EmissionDirection=Enum.NormalId.Back;e.SpreadAngle=Vector2.new(5,5)
        e.LightEmission=1;e.LockedToPart=true;e.Enabled=false;e.Parent=a
        local light=Instance.new("PointLight");light.Name=label.."Glow";light.Color=cyan;light.Range=7;light.Brightness=1.5;light.Enabled=false;light.Parent=a
    end
    for _,s in ipairs({-1,1}) do
        exhaust("Full",carriage,V(s*.78,.23,.86),5.1,1.10)
        exhaust("Mini",shell,V(s*1.54,-.07,3.92),.95,.32)
    end
    model:SetAttribute("BlueShiftRoadster",true);model:SetAttribute("RoadsterMode","Closed")
    return folder
end
return Body
